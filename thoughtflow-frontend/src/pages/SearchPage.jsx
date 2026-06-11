import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Loader, Search } from "lucide-react";
import PostCard from "../components/PostCard";
import API_BASE from "../config";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

const getCleanToken = () => {
  const rawToken = localStorage.getItem("token");
  return rawToken ? rawToken.replace(/^"|"$/g, "").trim() : "";
};

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getPostScore = (post) => {
  const likes = toNumber(post?.likes_count ?? (Array.isArray(post?.likes) ? post.likes.length : 0));
  const reposts = toNumber(post?.reposts_count ?? (Array.isArray(post?.reposts) ? post.reposts.length : 0));
  const bookmarks = toNumber(post?.bookmarks_count ?? (Array.isArray(post?.bookmarks) ? post.bookmarks.length : 0));
  const comments = toNumber(post?.comments_count ?? (Array.isArray(post?.comments) ? post.comments.length : 0));
  const views = toNumber(post?.views_counts ?? post?.views);

  const createdAt = new Date(post?.created_at || 0).getTime();
  const ageDays = Number.isFinite(createdAt) ? Math.max(0, (Date.now() - createdAt) / THIRTY_DAYS_MS * 30) : 30;
  const recencyBoost = Math.max(0, 40 - ageDays * 1.25);

  return (likes * 5) + (reposts * 6) + (bookmarks * 4) + (comments * 3) + (views * 0.08) + recencyBoost;
};

const isWithinLast30Days = (value) => {
  const timestamp = new Date(value || 0).getTime();
  if (!Number.isFinite(timestamp)) {
    return false;
  }

  return Date.now() - timestamp <= THIRTY_DAYS_MS;
};

function SearchPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = (searchParams.get("q") || "").trim();
  const [inputValue, setInputValue] = useState(query);
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentUsername, setCurrentUsername] = useState("");
  const [currentUserId, setCurrentUserId] = useState(null);
  const [deletingPostId, setDeletingPostId] = useState(null);
  const [activeTab, setActiveTab] = useState("top");

  useEffect(() => {
    setInputValue(query);
    if (query) {
      setActiveTab("top");
    }
  }, [query]);

  useEffect(() => {
    const token = getCleanToken();
    if (!token) {
      navigate("/");
      return;
    }

    const loadCurrentUser = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/user/`, {
          headers: {
            Authorization: "Token " + token,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setCurrentUsername(data.username || "");
          setCurrentUserId(data.id || null);
        }
      } catch (fetchError) {
        console.error("Failed to load current user:", fetchError);
      }
    };

    loadCurrentUser();
  }, [navigate]);

  useEffect(() => {
    const normalizedQuery = query;
    const token = getCleanToken();

    if (!normalizedQuery) {
      setPosts([]);
      setUsers([]);
      setError("");
      setIsLoading(false);
      return;
    }

    if (!token) {
      setError("Your session expired. Please log in again.");
      setPosts([]);
      setUsers([]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const loadSearchResults = async () => {
      try {
        setIsLoading(true);
        setError("");

        const response = await fetch(`${API_BASE}/api/search/?q=${encodeURIComponent(normalizedQuery)}&limit=1000`, {
          headers: {
            Authorization: "Token " + token,
          },
        });

        if (!response.ok) {
          throw new Error(`Search request failed with status ${response.status}`);
        }

        const data = await response.json();
        if (!cancelled) {
          setPosts(Array.isArray(data?.posts) ? data.posts : []);
          setUsers(Array.isArray(data?.users) ? data.users : []);
        }
      } catch (fetchError) {
        if (!cancelled) {
          console.error("Failed to load search results:", fetchError);
          setError("Could not load search results right now.");
          setPosts([]);
          setUsers([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadSearchResults();

    return () => {
      cancelled = true;
    };
  }, [query]);

  const topPosts = useMemo(() => {
    return [...posts]
      .sort((left, right) => {
        const scoreDelta = getPostScore(right) - getPostScore(left);
        if (scoreDelta !== 0) {
          return scoreDelta;
        }

        return new Date(right?.created_at || 0).getTime() - new Date(left?.created_at || 0).getTime();
      })
      .slice(0, 10);
  }, [posts]);

  const latestPosts = useMemo(() => {
    return [...posts]
      .filter((post) => isWithinLast30Days(post?.created_at))
      .sort((left, right) => new Date(right?.created_at || 0).getTime() - new Date(left?.created_at || 0).getTime())
      .slice(0, 10);
  }, [posts]);

  const normalizedUsers = useMemo(() => users.filter(Boolean), [users]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextQuery = inputValue.trim();
    if (!nextQuery) {
      return;
    }

    setSearchParams({ q: nextQuery });
  };

  const handleDeletePost = async (postId) => {
    const token = getCleanToken();
    if (!token || !postId) {
      return;
    }

    try {
      setDeletingPostId(postId);
      const response = await fetch(`${API_BASE}/api/posts/${postId}/`, {
        method: "DELETE",
        headers: {
          Authorization: "Token " + token,
        },
      });

      if (response.ok) {
        setPosts((currentPosts) => currentPosts.filter((post) => post.id !== postId));
      }
    } catch (deleteError) {
      console.error("Failed to delete post:", deleteError);
    } finally {
      setDeletingPostId(null);
    }
  };

  const handlePostUpdated = (postId, changes) => {
    if (!postId || !changes) {
      return;
    }

    setPosts((currentPosts) => currentPosts.map((post) => (
      post.id === postId ? { ...post, ...changes } : post
    )));
  };

  const _searchSummary = query ? `Results for “${query}”` : "Search posts";

  const activePosts = activeTab === "latest" ? latestPosts : topPosts;
  const _activeTabLabel = activeTab === "latest" ? "Latest" : "Top search";
  const activeTabDescription = activeTab === "latest"
    ? "LATEST POSTS"
    : "TOP SEARCHES";

  return (
    <main className="min-h-dvh bg-black text-white">
      <div className="fixed left-0 right-0 top-0 z-50 h-16 border-b border-zinc-900 bg-black/95 backdrop-blur">
        <div className="mx-auto flex h-full max-w-6xl items-center gap-3 px-4 md:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => navigate("/home")}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-transparent text-white transition hover:bg-zinc-900"
            aria-label="Back to home"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <form onSubmit={handleSubmit} className="flex flex-1 items-center gap-3 rounded-full border border-zinc-800 bg-zinc-950 px-4 py-2.5">
            <Search className="h-4 w-4 shrink-0 text-zinc-500" />
            <input
              type="text"
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              placeholder="Search posts, hashtags, people"
              className="w-full bg-transparent text-sm text-white placeholder:text-zinc-500 focus:outline-none"
            />
          </form>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-900 bg-black/95 backdrop-blur">
        <div className="mx-auto grid h-14 max-w-6xl grid-cols-3 px-2 md:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setActiveTab("top")}
            className={`text-sm font-semibold transition ${activeTab === "top" ? "text-white" : "text-zinc-500 hover:text-white"}`}
          >
            Top
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("latest")}
            className={`text-sm font-semibold transition ${activeTab === "latest" ? "text-white" : "text-zinc-500 hover:text-white"}`}
          >
            Latest
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("users")}
            className={`text-sm font-semibold transition ${activeTab === "users" ? "text-white" : "text-zinc-500 hover:text-white"}`}
          >
            Users
          </button>
        </div>
      </div>

      <section className="mx-auto min-h-dvh w-full max-w-6xl px-0 pt-16 pb-14">
        {activeTab !== "users" && !query ? (
          <div className="px-4 py-6 text-sm text-zinc-400 md:px-6 lg:px-8">
            Type a query and press Enter to open a dedicated results page.
          </div>
        ) : null}

        {activeTab !== "users" && isLoading ? (
          <div className="flex items-center justify-center py-16 text-zinc-400">
            <Loader className="mr-3 h-5 w-5 animate-spin" />
            Loading results...
          </div>
        ) : activeTab !== "users" && error ? (
          <div className="px-4 py-6 text-sm text-red-200 md:px-6 lg:px-8">{error}</div>
        ) : activeTab !== "users" ? (
          <div className="flex flex-col">
            <div className="px-4 py-3 text-xs uppercase tracking-[0.18em] text-zinc-500 md:px-6 lg:px-8">
              {activeTabDescription}
            </div>

            {activePosts.length > 0 ? (
              activePosts.map((post) => (
                <PostCard
                  key={`${activeTab}-search-${post.id}`}
                  post={post}
                  currentUsername={currentUsername}
                  currentUserId={currentUserId}
                  onDeletePost={handleDeletePost}
                  onPostUpdated={handlePostUpdated}
                  isDeletingPost={deletingPostId === post.id}
                />
              ))
            ) : (
              <div className="px-4 py-6 text-sm text-zinc-500 md:px-6 lg:px-8">
                {activeTab === "latest" ? "No latest posts found for this search." : "No top results found."}
              </div>
            )}
          </div>
        ) : null}
      </section>

      {activeTab === "users" && (
        <div className="w-full px-4 pt-16 pb-14 md:px-6 lg:px-8">
          {normalizedUsers.length > 0 ? (
            <>
              {normalizedUsers.map((user) => {
                const imageSrc = user?.profile_image
                  ? (user.profile_image.startsWith("http") ? user.profile_image : `${API_BASE}${user.profile_image}`)
                  : "";

                return (
                  <Link
                    key={`search-user-${user.id || user.username}`}
                    to={`/profile/${user.username}`}
                    className="flex items-center gap-3 py-4 transition hover:bg-zinc-950 w-full"
                  >
                    <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-zinc-800">
                      {imageSrc ? <img src={imageSrc} alt={user.username} className="h-full w-full object-cover" /> : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-white">{user.display_name || user.username}</p>
                      <p className="truncate text-sm text-zinc-500">@{user.username}</p>
                    </div>
                  </Link>
                );
              })}
            </>
          ) : (
            <div className="py-6 text-sm text-zinc-500">No matching users found.</div>
          )}
        </div>
      )}
    </main>
  );
}

export default SearchPage;