import React, { useCallback, useEffect, useState } from 'react';
import { Search } from "lucide-react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import CreatePost from "../components/Createpost";
import PostCard from '../components/PostCard';
import PostView from "../components/postview";
import MassangerSection from '../components/massangersection';
import SidebarNav from "../components/SidebarNav";
import ProfileSection from "../components/ProfileSection";

const API_BASE = "http://127.0.0.1:8000";
const HOME_UI_STATE_KEY = "thoughtflow_home_ui_state";

const getCleanToken = () => {
  const rawToken = localStorage.getItem("token");
  return rawToken ? rawToken.replace(/^"|"$/g, "").trim() : "";
};

const VIEWED_POSTS_STORAGE_KEY = "thoughtflow_viewed_posts";

const normalizeChatPerson = (person) => {
  if (!person?.username) {
    return null;
  }

  return {
    id: person.id || person.user_id || null,
    conversationId: person.conversationId || person.conversation_id || null,
    username: person.username,
    displayName: person.displayName || person.display_name || person.name || person.username,
    profileImage: person.profileImage || person.profile_image || "",
    unreadCount: Number(person.unreadCount || person.unread_count || 0),
    lastMessage: person.lastMessage || person.last_message || "",
    lastMessageAt: person.lastMessageAt || person.last_message_at || "",
  };
};

const normalizeConversation = (conversation) => {
  const otherUser = conversation?.other_user;
  if (!otherUser?.username) {
    return null;
  }

  return normalizeChatPerson({
    ...otherUser,
    conversationId: conversation.id,
    unreadCount: conversation.unread_count,
    lastMessage: conversation?.last_message?.content || "",
    lastMessageAt: conversation?.last_message_at || conversation?.last_message?.created_at || "",
  });
};

const getViewedPostIds = () => {
  try {
    const rawValue = sessionStorage.getItem(VIEWED_POSTS_STORAGE_KEY);
    const parsedValue = rawValue ? JSON.parse(rawValue) : [];
    return Array.isArray(parsedValue) ? parsedValue.map(String) : [];
  } catch (error) {
    console.error("Failed to read viewed post ids:", error);
    return [];
  }
};

const markPostAsViewed = (postId) => {
  try {
    const viewedPostIds = new Set(getViewedPostIds());
    viewedPostIds.add(String(postId));
    sessionStorage.setItem(VIEWED_POSTS_STORAGE_KEY, JSON.stringify(Array.from(viewedPostIds)));
  } catch (error) {
    console.error("Failed to store viewed post id:", error);
  }
};

function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const { username: routeUsername } = useParams();

  const [loginStatus, setLoginStatus] = useState(() => Boolean(localStorage.getItem("token")));
  const [profilePicture, setProfilePicture] = useState(null);
  const [currentUsername, setCurrentUsername] = useState("");
  const [currentUserId, setCurrentUserId] = useState(null);
  const [followingIds, setFollowingIds] = useState([]);
  const [posts, setPosts] = useState([]);
  const [activeButton, setActiveButton] = useState(() => {
    if (location.pathname.startsWith("/profile")) {
      return "profile";
    }

    try {
      const savedState = JSON.parse(sessionStorage.getItem(HOME_UI_STATE_KEY) || "{}");
      const savedButton = savedState?.activeButton;
      if (["home", "chats", "bookmarks"].includes(savedButton)) {
        return savedButton;
      }
    } catch (error) {
      console.error("Failed to read saved home UI state:", error);
    }

    return "home";
  });
  const [feedTab, setFeedTab] = useState(() => {
    try {
      const savedState = JSON.parse(sessionStorage.getItem(HOME_UI_STATE_KEY) || "{}");
      const savedFeedTab = savedState?.feedTab;
      if (savedFeedTab === "Following" || savedFeedTab === "For You") {
        return savedFeedTab;
      }
    } catch (error) {
      console.error("Failed to read saved feed tab:", error);
    }

    return "For You";
  });
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [feedError, setFeedError] = useState("");
  const [selectedPost, setSelectedPost] = useState(null);
  const [deletingPostIds, setDeletingPostIds] = useState([]);
  const [selectedChatUser, setSelectedChatUser] = useState(null);
  const [selectedConversationId, setSelectedConversationId] = useState(() => {
    try {
      const savedState = JSON.parse(sessionStorage.getItem(HOME_UI_STATE_KEY) || "{}");
      const savedConversationId = Number(savedState?.selectedConversationId);
      return Number.isFinite(savedConversationId) && savedConversationId > 0 ? savedConversationId : null;
    } catch (error) {
      console.error("Failed to read saved selected conversation:", error);
      return null;
    }
  });
  const [chatConversations, setChatConversations] = useState([]);
  const [chatPeopleResults, setChatPeopleResults] = useState([]);
  const [chatSearchQuery, setChatSearchQuery] = useState(() => {
    try {
      const savedState = JSON.parse(sessionStorage.getItem(HOME_UI_STATE_KEY) || "{}");
      return typeof savedState?.chatSearchQuery === "string" ? savedState.chatSearchQuery : "";
    } catch (error) {
      console.error("Failed to read saved chat search query:", error);
      return "";
    }
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [uiNotice, setUiNotice] = useState({ type: "", message: "" });
  const [deletePostConfirmId, setDeletePostConfirmId] = useState(null);
  const [sharePickerState, setSharePickerState] = useState({ open: false, post: null, query: "" });

  const showUiNotice = useCallback((type, message) => {
    setUiNotice({ type, message });
    window.setTimeout(() => {
      setUiNotice((current) => (current.message === message ? { type: "", message: "" } : current));
    }, 2600);
  }, []);

  const goTo = useCallback((path) => {
    navigate(path);
  }, [navigate]);

  const handleSelectChatUser = async (person) => {
    const normalizedPerson = normalizeChatPerson(person);
    if (!normalizedPerson) {
      return;
    }

    if (normalizedPerson.conversationId) {
      setSelectedConversationId(normalizedPerson.conversationId);
      setSelectedChatUser(normalizedPerson);
      return;
    }

    const token = getCleanToken();
    if (!token) {
      setDeletePostConfirmId(null);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/chat/conversations/start/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Token " + token,
        },
        body: JSON.stringify({ username: normalizedPerson.username }),
      });

      if (!response.ok) {
        throw new Error(`Failed to start conversation: ${response.status}`);
      }

      const conversationData = await response.json();
      const normalizedConversation = normalizeConversation(conversationData);
      if (!normalizedConversation) {
        return;
      }

      setSelectedConversationId(normalizedConversation.conversationId);
      setSelectedChatUser(normalizedConversation);
      setChatConversations((currentConversations) => {
        const withoutSelected = currentConversations.filter((item) => item.conversationId !== normalizedConversation.conversationId);
        return [normalizedConversation, ...withoutSelected];
      });
    } catch (error) {
      console.error("Failed to start conversation:", error);
    }
  };

  const ensureConversationWithUsername = async (username) => {
    const token = getCleanToken();
    if (!token || !username) {
      return null;
    }

    const response = await fetch(`${API_BASE}/api/chat/conversations/start/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Token " + token,
      },
      body: JSON.stringify({ username }),
    });

    if (!response.ok) {
      throw new Error(`Failed to start conversation: ${response.status}`);
    }

    const conversationData = await response.json();
    return normalizeConversation(conversationData);
  };

  const sharePostToUser = async ({ post, targetUsername }) => {
    if (!post?.id || !targetUsername) {
      return;
    }

    const token = getCleanToken();
    if (!token) {
      return;
    }

    const normalizedConversation = await ensureConversationWithUsername(targetUsername);
    if (!normalizedConversation?.conversationId) {
      throw new Error("Conversation was not created");
    }

    const payload = new FormData();
    payload.append("content", `Shared a post from @${post?.username || "user"}`);
    payload.append("shared_post_id", String(post.id));

    const sendResponse = await fetch(`${API_BASE}/api/chat/conversations/${normalizedConversation.conversationId}/messages/`, {
      method: "POST",
      headers: {
        Authorization: "Token " + token,
      },
      body: payload,
    });

    if (!sendResponse.ok) {
      throw new Error(`Failed to share post in chat: ${sendResponse.status}`);
    }

    setSelectedConversationId(normalizedConversation.conversationId);
    setSelectedChatUser(normalizedConversation);
    setActiveButton("chats");
    await fetchChatConversations();
  };

  const handleSharePost = async (post) => {
    if (!post?.id) {
      return;
    }

    setSharePickerState({ open: true, post, query: "" });
    if (chatConversations.length === 0) {
      await fetchChatConversations();
    }
  };

  const handleSelectShareRecipient = async (person) => {
    const targetUsername = person?.username;
    if (!targetUsername || !sharePickerState?.post?.id) {
      return;
    }

    try {
      await sharePostToUser({ post: sharePickerState.post, targetUsername });
      showUiNotice("success", `Post shared with @${targetUsername}`);
      setSharePickerState({ open: false, post: null, query: "" });
    } catch (error) {
      console.error("Failed to share post:", error);
      showUiNotice("error", "Could not share this post right now.");
    }
  };

  useEffect(() => {
    const token = getCleanToken();
    setLoginStatus(Boolean(token));

    if (!token) {
      goTo("/");
    }
  }, [loginStatus, goTo]);

  useEffect(() => {
    if (location.pathname.startsWith("/profile")) {
      setActiveButton("profile");
      return;
    }

    if (activeButton === "profile") {
      setActiveButton("home");
    }
  }, [location.pathname, activeButton]);

  useEffect(() => {
    if (location.pathname.startsWith("/profile")) {
      return;
    }

    try {
      sessionStorage.setItem(
        HOME_UI_STATE_KEY,
        JSON.stringify({
          activeButton,
          feedTab,
          selectedConversationId,
          chatSearchQuery,
        })
      );
    } catch (error) {
      console.error("Failed to save home UI state:", error);
    }
  }, [activeButton, feedTab, selectedConversationId, chatSearchQuery, location.pathname]);

  const fetchProfile = useCallback(async () => {
    try {
      const token = getCleanToken();
      const response = await fetch(`${API_BASE}/api/profile/`, {
        method: "GET",
        headers: {
          Authorization: "Token " + token,
        },
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = await response.json();
      setProfilePicture(data.profile_image);
      setCurrentUsername(data.username || "");
      setCurrentUserId(Number(data?.user_id) || null);
      setFollowingIds(Array.isArray(data.following) ? data.following.map(String) : []);
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
    }
  }, []);

  const fetchPosts = useCallback(async () => {
    try {
      setIsLoadingPosts(true);
      setFeedError("");
      const token = getCleanToken();

      if (!token) {
        setFeedError("Your session expired. Please log in again.");
        setPosts([]);
        return;
      }

      const response = await fetch(`${API_BASE}/api/posts/`, {
        method: "GET",
        headers: {
          Authorization: "Token " + token,
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("token");
          setLoginStatus(false);
          goTo("/");
          return;
        }
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = await response.json();
      if (Array.isArray(data)) {
        setPosts(data);
      } else if (Array.isArray(data?.results)) {
        setPosts(data.results);
      } else {
        setFeedError("Unexpected posts response format from API.");
        setPosts([]);
      }
    } catch (error) {
      console.error("Failed to fetch posts:", error);
      setFeedError("Failed to load posts. Make sure backend is running and you are logged in.");
      setPosts([]);
    } finally {
      setIsLoadingPosts(false);
    }
  }, [goTo]);

  useEffect(() => {
    fetchProfile();
    fetchPosts();
  }, [fetchProfile, fetchPosts]);

  const fetchChatConversations = useCallback(async () => {
    const token = getCleanToken();
    if (!token) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/chat/conversations/`, {
        headers: {
          Authorization: "Token " + token,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch conversations: ${response.status}`);
      }

      const data = await response.json();
      const normalizedConversations = Array.isArray(data)
        ? data.map(normalizeConversation).filter(Boolean)
        : [];

      setChatConversations(normalizedConversations);
      setSelectedConversationId((currentId) => {
        if (currentId && normalizedConversations.some((item) => item.conversationId === currentId)) {
          return currentId;
        }
        return null;
      });
    } catch (error) {
      console.error("Failed to fetch chat conversations:", error);
      setChatConversations([]);
      setSelectedConversationId(null);
    }
  }, []);

  const fetchChatPeople = useCallback(async (query) => {
    const token = getCleanToken();
    if (!token) {
      return;
    }

    try {
      const encodedQuery = encodeURIComponent(query || "");
      const response = await fetch(`${API_BASE}/api/chat/users/search/?q=${encodedQuery}`, {
        headers: {
          Authorization: "Token " + token,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch chat users: ${response.status}`);
      }

      const data = await response.json();
      const normalizedPeople = Array.isArray(data)
        ? data.map(normalizeChatPerson).filter(Boolean)
        : [];
      setChatPeopleResults(normalizedPeople);
    } catch (error) {
      console.error("Failed to fetch chat users:", error);
      setChatPeopleResults([]);
    }
  }, []);

  useEffect(() => {
    if (activeButton !== "chats") {
      return;
    }

    fetchChatConversations();
  }, [activeButton, fetchChatConversations]);

  useEffect(() => {
    if (activeButton !== "chats") {
      return;
    }

    const pollId = setInterval(() => {
      fetchChatConversations();
    }, 3000);

    return () => clearInterval(pollId);
  }, [activeButton, fetchChatConversations]);

  useEffect(() => {
    if (activeButton !== "chats") {
      return;
    }

    fetchChatPeople(chatSearchQuery);
  }, [activeButton, chatSearchQuery, fetchChatPeople]);

  useEffect(() => {
    const selectedConversation = chatConversations.find((conversation) => conversation.conversationId === selectedConversationId) || null;
    setSelectedChatUser(selectedConversation);
  }, [chatConversations, selectedConversationId]);

  const handleButtonClick = (buttonName) => {
    setSelectedPost(null);
    setActiveButton(buttonName);

    if (buttonName === "chats") {
      setSelectedConversationId(null);
      setSelectedChatUser(null);
      goTo("/home");
      return;
    }

    if (buttonName === "profile") {
      goTo("/profile");
      return;
    }

    goTo("/home");
  };

  function handleLogout() {
    localStorage.removeItem("token");
    goTo("/");
  }

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();

  const filteredPosts = posts.filter((post) => {
    const content = typeof post?.content === "string" ? post.content : "";
    const username = typeof post?.username === "string" ? post.username : "";
    const displayName = typeof post?.display_name === "string" ? post.display_name : "";
    const query = normalizedSearchQuery;

    return (
      content.toLowerCase().includes(query) ||
      username.toLowerCase().includes(query) ||
      displayName.toLowerCase().includes(query)
    );
  });

  const matchingPeople = Array.from(
    posts.reduce((peopleMap, post) => {
      const username = typeof post?.username === "string" ? post.username.trim() : "";
      if (!username || peopleMap.has(username.toLowerCase())) {
        return peopleMap;
      }

      const displayName = typeof post?.display_name === "string" ? post.display_name.trim() : "";
      const profileImage = typeof post?.profile_image === "string" ? post.profile_image : "";
      const matchesSearch = !normalizedSearchQuery || [username, displayName].some((value) => value.toLowerCase().includes(normalizedSearchQuery));

      if (matchesSearch) {
        peopleMap.set(username.toLowerCase(), {
          username,
          displayName,
          profileImage,
        });
      }

      return peopleMap;
    }, new Map()).values()
  );

  const isFollowingView = feedTab === "Following";
  const isBookmarksView = activeButton === "bookmarks";
  const isMassangerView = activeButton === "chats";
  const isProfileView = activeButton === "profile";
  const isFeedView = !isMassangerView && !isProfileView;
  const normalizedChatSearchQuery = chatSearchQuery.trim().toLowerCase();
  const filteredChatConversations = chatConversations.filter((person) => {
    const username = (person?.username || "").toLowerCase();
    const displayName = (person?.displayName || "").toLowerCase();

    if (!normalizedChatSearchQuery) {
      return true;
    }

    return username.includes(normalizedChatSearchQuery) || displayName.includes(normalizedChatSearchQuery);
  });
  const filteredPeopleSuggestions = chatPeopleResults.filter((person) => {
    if (!normalizedChatSearchQuery) {
      return true;
    }

    const username = (person?.username || "").toLowerCase();
    const displayName = (person?.displayName || "").toLowerCase();
    return username.includes(normalizedChatSearchQuery) || displayName.includes(normalizedChatSearchQuery);
  });
  const conversationUsernames = new Set(
    chatConversations
      .map((person) => (person?.username || "").toLowerCase())
      .filter(Boolean)
  );
  const filteredNewChatPeople = filteredPeopleSuggestions.filter((person) => {
    const username = (person?.username || "").toLowerCase();
    if (!username) {
      return false;
    }

    if (username === (currentUsername || "").toLowerCase()) {
      return false;
    }

    return !conversationUsernames.has(username);
  });
  const filteredShareRecipients = chatConversations.filter((person) => {
    const query = (sharePickerState.query || "").trim().toLowerCase();
    if (!query) {
      return true;
    }

    const username = (person?.username || "").toLowerCase();
    const displayName = (person?.displayName || "").toLowerCase();
    return username.includes(query) || displayName.includes(query);
  });
  const visiblePosts = isBookmarksView
    ? filteredPosts.filter((post) => Boolean(post?.is_bookmarked))
    : isFollowingView
      ? filteredPosts.filter((post) => followingIds.includes(String(post?.user)))
      : filteredPosts;

  const handleSelectPost = (post) => {
    setSelectedPost(post);

    if (!post?.id) {
      return;
    }

    if (getViewedPostIds().includes(String(post.id))) {
      return;
    }

    const token = getCleanToken();
    if (!token) {
      return;
    }

    fetch(`${API_BASE}/api/posts/${post.id}/views/`, {
      method: "POST",
      headers: {
        Authorization: "Token " + token,
      },
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        return response.json();
      })
      .then((data) => {
        const nextViews = typeof data?.views === "number" ? data.views : (Number(post?.views) || 0) + 1;
        markPostAsViewed(post.id);

        setSelectedPost((currentPost) => (
          currentPost?.id === post.id
            ? { ...currentPost, views: nextViews }
            : currentPost
        ));

        setPosts((currentPosts) => currentPosts.map((currentPost) => (
          currentPost.id === post.id
            ? { ...currentPost, views: nextViews }
            : currentPost
        )));
      })
      .catch((error) => {
        console.error("Failed to increment post views:", error);
      });
  };

  const handleClosePostView = () => {
    setSelectedPost(null);
  };

  const handleDeletePost = async (postId) => {
    if (!postId) {
      return;
    }

    setDeletePostConfirmId(postId);
  };

  const handleConfirmDeletePost = async () => {
    const postId = deletePostConfirmId;
    if (!postId) {
      return;
    }

    const token = getCleanToken();
    if (!token) {
      return;
    }

    try {
      setDeletingPostIds((current) => (current.includes(postId) ? current : [...current, postId]));

      const response = await fetch(`${API_BASE}/api/posts/${postId}/`, {
        method: "DELETE",
        headers: {
          Authorization: "Token " + token,
        },
      });

      if (!response.ok) {
        throw new Error(`Delete request failed with status ${response.status}`);
      }

      setPosts((currentPosts) => currentPosts.filter((post) => post.id !== postId));
      setSelectedPost((currentPost) => (currentPost?.id === postId ? null : currentPost));
      showUiNotice("success", "Post deleted.");
    } catch (error) {
      console.error("Failed to delete post:", error);
      showUiNotice("error", "Failed to delete post.");
    } finally {
      setDeletingPostIds((current) => current.filter((id) => id !== postId));
      setDeletePostConfirmId(null);
    }
  };

  const handlePostUpdated = (postId, changes) => {
    if (!postId || !changes) {
      return;
    }

    setPosts((currentPosts) => currentPosts.map((post) => (
      post.id === postId ? { ...post, ...changes } : post
    )));

    setSelectedPost((currentPost) => (
      currentPost?.id === postId ? { ...currentPost, ...changes } : currentPost
    ));
  };

  const handleOwnProfileUpdate = (data) => {
    setProfilePicture(data?.profile_image || null);
    setCurrentUsername(data?.username || "");
    setCurrentUserId(Number(data?.user_id) || null);
    setFollowingIds(Array.isArray(data?.following) ? data.following.map(String) : []);
  };

  const handleOpenProfileFromChat = (event, username) => {
    event.stopPropagation();
    event.preventDefault();
    if (!username) {
      return;
    }

    setSelectedPost(null);
    goTo(`/profile/${username}`);
  };

  if (!loginStatus) {
    return null;
  }


  return (
    <main className="bg-black w-full h-screen overflow-hidden">
      {uiNotice.message ? (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl border text-sm shadow-lg ${uiNotice.type === "error" ? "border-red-500/40 bg-red-900/40 text-red-200" : "border-green-500/40 bg-green-900/40 text-green-200"}`}>
          {uiNotice.message}
        </div>
      ) : null}
      <SidebarNav activeButton={activeButton} onSelect={handleButtonClick} onLogout={handleLogout} />

      <section className="ml-[20%] flex h-screen w-[80%] overflow-hidden">
        <article className="flex flex-col h-screen w-[60%] text-white border-zinc-900 border-l border-r overflow-hidden">
        {isMassangerView ? (
          <MassangerSection
            selectedUser={selectedChatUser}
            selectedConversationId={selectedConversationId}
            currentUserId={currentUserId}
            onConversationChanged={fetchChatConversations}
          />
        ) : isProfileView ? (
          <ProfileSection
            viewedUsername={routeUsername || ""}
            currentUsername={currentUsername}
            currentUserId={currentUserId}
            posts={posts}
            onBackHome={() => handleButtonClick("home")}
            onNavigateProfile={(username) => {
              setSelectedPost(null);
              setActiveButton("profile");
              goTo(`/profile/${username}`);
            }}
            onOpenPost={handleSelectPost}
            onDeletePost={handleDeletePost}
            onPostUpdated={handlePostUpdated}
            deletingPostIds={deletingPostIds}
            onOwnProfileUpdated={handleOwnProfileUpdate}
          />
        ) : selectedPost ? (
          <section className="flex-1 overflow-y-auto posts-scrollbar">
            <PostView
              post={selectedPost}
              onBack={handleClosePostView}
              currentUsername={currentUsername}
              currentUserId={currentUserId}
              currentUserProfilePicture={profilePicture}
              onDeletePost={handleDeletePost}
              onPostUpdated={handlePostUpdated}
              isDeletingPost={deletingPostIds.includes(selectedPost?.id)}
            />
          </section>
        ) : (
          <>
            {isFeedView && !isBookmarksView ? (
              <header className="flex w-full h-[8%]">
                <button
                  className={`text-zinc-400 transition-all duration-200 hover:text-white w-[50%] ${feedTab === "For You" ? "bg-linear-to-r from-zinc-950 to-zinc-900" : "bg-black"}`}
                  onClick={() => setFeedTab("For You")}
                >
                  For You
                </button>
                <button
                  className={`text-zinc-400 transition-all duration-200 hover:text-white w-[50%] ${feedTab === "Following" ? "bg-linear-to-l from-zinc-950 to-zinc-900" : "bg-black "}`}
                  onClick={() => setFeedTab("Following")}
                >
                 Following
                </button>
              </header>
            ) : null}
            <section className="flex-1 overflow-y-auto posts-scrollbar">
              {!isBookmarksView ? (
                <CreatePost
                  profilePicture={profilePicture}
                  onPostCreated={(createdPost) => setPosts((prevPosts) => [createdPost, ...prevPosts])}
                />
              ) : null}
              {isLoadingPosts ? (
                <div className="text-zinc-500 p-6 text-center">Loading posts...</div>
              ) : feedError ? (
                <div className="text-red-400 p-6 text-center">{feedError}</div>
              ) : visiblePosts.length > 0 ? (
                visiblePosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onClick={handleSelectPost}
                    currentUsername={currentUsername}
                    currentUserId={currentUserId}
                    onDeletePost={handleDeletePost}
                    onPostUpdated={handlePostUpdated}
                    onSharePost={handleSharePost}
                    isDeletingPost={deletingPostIds.includes(post.id)}
                  />
                ))
              ) : (
                <div className="text-zinc-500 p-6 text-center">
                  {isBookmarksView ? "No bookmarked posts yet." : "No posts yet. Be the first to post."}
                </div>
              )}
            </section>
          </>
        )}
        </article>
        <aside className="flex flex-col border items-center w-[40%] h-screen text-white border-zinc-800 overflow-y-auto posts-scrollbar">
          {isMassangerView ? (
            <section className="w-full h-full flex flex-col">
              <div className="w-full border-b border-zinc-800 px-5 py-4 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold">Chats</h2>
                  <p className="text-sm text-zinc-500 mt-1">People you started conversations with</p>
                </div>
                <div className="w-[52%] min-w-45 h-10 border border-zinc-800 rounded-full px-3 flex items-center gap-2 bg-black">
                  <Search className="w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    value={chatSearchQuery}
                    onChange={(event) => setChatSearchQuery(event.target.value)}
                    placeholder="Search people"
                    className="bg-transparent w-full text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto posts-scrollbar">
                {filteredChatConversations.length > 0 ? (
                  <section className="flex flex-col">
                    {filteredChatConversations.map((person) => {
                      const isSelected = selectedChatUser?.username === person.username;
                      const imageSrc = person.profileImage
                        ? (person.profileImage.startsWith("http") ? person.profileImage : `${API_BASE}${person.profileImage}`)
                        : "";

                      return (
                        <div
                          key={`conversation-${person.username}`}
                          onClick={() => handleSelectChatUser(person)}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b border-zinc-900/70 transition ${isSelected ? "bg-zinc-900" : "hover:bg-zinc-900/80"}`}
                        >
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-800 shrink-0">
                            {imageSrc ? <img src={imageSrc} alt={person.username} className="w-full h-full object-cover" /> : null}
                          </div>
                          <div className="min-w-0 flex-1">
                            <Link
                              to={`/profile/${person.username}`}
                              className="inline-flex max-w-fit text-white font-semibold truncate hover:underline"
                              onClick={(event) => handleOpenProfileFromChat(event, person.username)}
                            >
                              {person.displayName || person.username}
                            </Link>
                            <Link
                              to={`/profile/${person.username}`}
                              className="mt-0.5 inline-flex max-w-fit text-sm text-zinc-500 truncate hover:underline"
                              onClick={(event) => handleOpenProfileFromChat(event, person.username)}
                            >
                              @{person.username}
                            </Link>
                          </div>
                          {Number(person.unreadCount) > 0 ? (
                            <div className="ml-2 flex items-center gap-2 shrink-0">
                              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                              <span className="text-[11px] font-semibold text-blue-300">{person.unreadCount}</span>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </section>
                ) : null}

                {filteredNewChatPeople.length > 0 ? (
                  <section className="p-4 flex flex-col gap-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-500 font-semibold">Start New Chat</p>
                    {filteredNewChatPeople.map((person) => {
                      const imageSrc = person.profileImage
                        ? (person.profileImage.startsWith("http") ? person.profileImage : `${API_BASE}${person.profileImage}`)
                        : "";

                      return (
                        <div
                          key={`new-chat-${person.username}`}
                          onClick={() => handleSelectChatUser(person)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left border border-zinc-900 rounded-xl hover:bg-zinc-900/80 transition"
                        >
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-800 shrink-0">
                            {imageSrc ? <img src={imageSrc} alt={person.username} className="w-full h-full object-cover" /> : null}
                          </div>
                          <div className="min-w-0 flex-1">
                            <Link
                              to={`/profile/${person.username}`}
                              className="inline-flex max-w-fit text-white font-semibold truncate hover:underline"
                              onClick={(event) => handleOpenProfileFromChat(event, person.username)}
                            >
                              {person.displayName || person.username}
                            </Link>
                            <Link
                              to={`/profile/${person.username}`}
                              className="mt-0.5 inline-flex max-w-fit text-sm text-zinc-500 truncate hover:underline"
                              onClick={(event) => handleOpenProfileFromChat(event, person.username)}
                            >
                              @{person.username}
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </section>
                ) : null}

                {filteredChatConversations.length === 0 && filteredNewChatPeople.length === 0 ? (
                  <p className="p-6 text-sm text-zinc-500">No people found for this search.</p>
                ) : null}
              </div>
            </section>
          ) : (
            <>
              <button
                type="button"
                className=" flex flex-row gap-5 mt-5 justify m-5 items-center w-[90%] h-12 border rounded-4xl "
              >
                <Search className=" ml-5 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search"
                  className="bg-black w-full h-full text-zinc-300 placeholder:text-zinc-500 focus:outline-none rounded-4xl"
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </button>
              {normalizedSearchQuery ? (
                <section className="w-[90%] rounded-2xl border border-zinc-800 bg-zinc-950/80 shadow-lg overflow-hidden mx-5">
                  <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white">People</h3>
                    <span className="text-xs text-zinc-500">{matchingPeople.length}</span>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {matchingPeople.length > 0 ? (
                      matchingPeople.map((person) => (
                        <button
                          key={person.username}
                          type="button"
                          onClick={() => {
                            setSelectedPost(null);
                            setActiveButton("profile");
                            goTo(`/profile/${person.username}`);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left border-b border-zinc-900/70 hover:bg-zinc-900/80 transition"
                        >
                          <div className="w-11 h-11 rounded-full overflow-hidden bg-zinc-800 shrink-0">
                            {person.profileImage ? (
                              <img
                                src={person.profileImage.startsWith("http") ? person.profileImage : `${API_BASE}${person.profileImage}`}
                                alt={person.username}
                                className="w-full h-full object-cover"
                              />
                            ) : null}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-white font-medium truncate">
                              {person.displayName || person.username}
                            </p>
                            <p className="text-sm text-zinc-500 truncate">@{person.username}</p>
                          </div>
                        </button>
                      ))
                    ) : (
                      <p className="px-4 py-6 text-sm text-zinc-500">No people match that username.</p>
                    )}
                  </div>
                </section>
              ) : null}
              <section className="flex w-full mt-5 flex-col" >
                <div className="text-lg w-full border-b-[0.5px] border-zinc-800 p-5 font-bold text-left ">Trending</div>
              </section>
            </>
          )}
      </aside>
      </section>

      {sharePickerState.open ? (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-700 bg-zinc-950 p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-white">Share Post</h3>
              <button
                type="button"
                onClick={() => setSharePickerState({ open: false, post: null, query: "" })}
                className="text-zinc-400 hover:text-white"
              >
                Close
              </button>
            </div>

            <p className="mt-1 text-sm text-zinc-500">Choose someone you already chatted with.</p>

            <input
              type="text"
              value={sharePickerState.query}
              onChange={(event) => setSharePickerState((current) => ({ ...current, query: event.target.value }))}
              placeholder="Search chat people"
              className="mt-4 w-full rounded-xl border border-zinc-700 bg-black px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none"
            />

            <div className="mt-4 max-h-72 overflow-y-auto posts-scrollbar flex flex-col gap-2">
              {filteredShareRecipients.length > 0 ? (
                filteredShareRecipients.map((person) => {
                  const imageSrc = person.profileImage
                    ? (person.profileImage.startsWith("http") ? person.profileImage : `${API_BASE}${person.profileImage}`)
                    : "";

                  return (
                    <button
                      key={`share-recipient-${person.username}`}
                      type="button"
                      onClick={() => handleSelectShareRecipient(person)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl border border-zinc-800 text-left hover:bg-zinc-900"
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-800 shrink-0">
                        {imageSrc ? <img src={imageSrc} alt={person.username} className="w-full h-full object-cover" /> : null}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-white font-medium truncate">{person.displayName || person.username}</p>
                        <p className="text-xs text-zinc-500 truncate">@{person.username}</p>
                      </div>
                    </button>
                  );
                })
              ) : (
                <p className="text-sm text-zinc-500 py-8 text-center">No existing chat people found.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {deletePostConfirmId ? (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-950 p-5">
            <h3 className="text-lg font-semibold text-white">Delete Post</h3>
            <p className="mt-2 text-sm text-zinc-400">Delete this post? This action cannot be undone.</p>
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletePostConfirmId(null)}
                className="px-4 py-2 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeletePost}
                className="px-4 py-2 rounded-lg bg-white text-black font-semibold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

export default Home;