import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, MessageCircle, Bookmark, Share2, Kanban,Repeat2, Ellipsis } from "lucide-react";
import PostSettingHover from "../hoverelements/postsettinghover";

const API_BASE = "http://127.0.0.1:8000";

const getCleanToken = () => {
    const rawToken = localStorage.getItem("token");
    return rawToken ? rawToken.replace(/^"|"$/g, "").trim() : "";
};


function PostCard({ post, onClick, currentUsername, currentUserId, onDeletePost, onPostUpdated, onSharePost, isDeletingPost = false }) {
    const getRelativePostTime = (value) => {
        if (!value) return "";
        const created = new Date(value);
        if (Number.isNaN(created.getTime())) return "";

        const seconds = Math.max(1, Math.floor((Date.now() - created.getTime()) / 1000));
        if (seconds < 60) return "just now";

        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;

        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;

        const days = Math.floor(hours / 24);
        if (days < 7) return `${days}d ago`;

        const weeks = Math.floor(days / 7);
        if (weeks < 5) return `${weeks}w ago`;

        const months = Math.floor(days / 30);
        if (months < 12) return `${months}mo ago`;

        const years = Math.floor(days / 365);
        return `${years}y ago`;
    };

    const createdAt = getRelativePostTime(post?.created_at);
    const [liked, setLiked] = useState(Boolean(post?.is_liked));
    const [reposted, setReposted] = useState(Boolean(post?.is_reposted));
    const [bookmarked, setBookmarked] = useState(Boolean(post?.is_bookmarked));
    const [likesCount, setLikesCount] = useState(
        typeof post?.likes_count === "number"
            ? post.likes_count
            : Array.isArray(post?.likes)
                ? post.likes.length
                : 0
    );
    const [repostsCount, setRepostsCount] = useState(
        typeof post?.reposts_count === "number"
            ? post.reposts_count
            : Array.isArray(post?.reposts)
                ? post.reposts.length
                : 0
    );
    const [bookmarksCount, setBookmarksCount] = useState(
        typeof post?.bookmarks_count === "number"
            ? post.bookmarks_count
            : Array.isArray(post?.bookmarks)
                ? post.bookmarks.length
                : 0
    );
    const commentsCount = typeof post?.comments_count === "number" ? post.comments_count : 0;
    const [likeLoading, setLikeLoading] = useState(false);
    const [bookmarkLoading, setBookmarkLoading] = useState(false);
    const [repostLoading, setRepostLoading] = useState(false);
    const [showSettingsHover, setShowSettingsHover] = useState(false);

    useEffect(() => {
        setLiked(Boolean(post?.is_liked));
        setBookmarked(Boolean(post?.is_bookmarked));
        setReposted(Boolean(post?.is_reposted));
        setLikesCount(
            typeof post?.likes_count === "number"
                ? post.likes_count
                : Array.isArray(post?.likes)
                    ? post.likes.length
                    : 0
        );
        setRepostsCount(
            typeof post?.reposts_count === "number"
                ? post.reposts_count
                : Array.isArray(post?.reposts)
                    ? post.reposts.length
                    : 0
        );
        setBookmarksCount(
            typeof post?.bookmarks_count === "number"
                ? post.bookmarks_count
                : Array.isArray(post?.bookmarks)
                    ? post.bookmarks.length
                    : 0
        );
    }, [post]);

    const toggleLike = async () => {
        if (!post?.id || likeLoading) return;
        const token = getCleanToken();
        if (!token) return;

        try {
            setLikeLoading(true);
            const response = await fetch(`${API_BASE}/api/posts/${post.id}/like/`, {
                method: "POST",
                headers: {
                    Authorization: "Token " + token,
                },
            });

            if (!response.ok) {
                throw new Error(`Like request failed: ${response.status}`);
            }

            const data = await response.json();
            const nextLiked = Boolean(data?.liked);
            const nextLikesCount = typeof data?.likes_count === "number" ? data.likes_count : likesCount;

            setLiked(nextLiked);
            setLikesCount(nextLikesCount);

            if (typeof onPostUpdated === "function") {
                onPostUpdated(post.id, {
                    is_liked: nextLiked,
                    likes_count: nextLikesCount,
                });
            }
        } catch (error) {
            console.error("Failed to toggle like:", error);
        } finally {
            setLikeLoading(false);
        }
    };

    const toggleRepost = async () => {
        if (!post?.id || repostLoading) return;
        const token = getCleanToken();
        if (!token) return;

        try {
            setRepostLoading(true);
            const response = await fetch(`${API_BASE}/api/posts/${post.id}/repost/`, {
                method: "POST",
                headers: {
                    Authorization: "Token " + token,
                },
            });

            if (!response.ok) {
                throw new Error(`Repost request failed: ${response.status}`);
            }

            const data = await response.json();
            const nextReposted = Boolean(data?.reposted);
            const nextRepostsCount = typeof data?.reposts_count === "number" ? data.reposts_count : repostsCount;
            const existingRepostUsers = Array.isArray(post?.repost_users) ? post.repost_users.map(Number) : [];
            const normalizedCurrentUserId = Number(currentUserId) || null;

            const nextRepostUsers = normalizedCurrentUserId
                ? (nextReposted
                    ? Array.from(new Set([...existingRepostUsers, normalizedCurrentUserId]))
                    : existingRepostUsers.filter((id) => id !== normalizedCurrentUserId))
                : existingRepostUsers;

            setReposted(nextReposted);
            setRepostsCount(nextRepostsCount);

            if (typeof onPostUpdated === "function") {
                onPostUpdated(post.id, {
                    is_reposted: nextReposted,
                    reposts_count: nextRepostsCount,
                    repost_users: nextRepostUsers,
                });
            }
        } catch (error) {
            console.error("Failed to toggle repost:", error);
        } finally {
            setRepostLoading(false);
        }
    };

    const toggleBookmark = async () => {
        if (!post?.id || bookmarkLoading) return;
        const token = getCleanToken();
        if (!token) return;

        try {
            setBookmarkLoading(true);
            const response = await fetch(`${API_BASE}/api/posts/${post.id}/bookmarks/`, {
                method: "POST",
                headers: {
                    Authorization: "Token " + token,
                },
            });

            if (!response.ok) {
                throw new Error(`Bookmark request failed: ${response.status}`);
            }

            const data = await response.json();
            const nextBookmarked = Boolean(data?.bookmarked);
            const nextBookmarksCount = typeof data?.bookmarks_count === "number" ? data.bookmarks_count : bookmarksCount;

            setBookmarked(nextBookmarked);
            setBookmarksCount(nextBookmarksCount);

            if (typeof onPostUpdated === "function") {
                onPostUpdated(post.id, {
                    is_bookmarked: nextBookmarked,
                    bookmarks_count: nextBookmarksCount,
                });
            }
        } catch (error) {
            console.error("Failed to toggle bookmark:", error);
        } finally {
            setBookmarkLoading(false);
        }
    };

    const handleCardClick = () => {
        if (typeof onClick === "function") {
            onClick(post);
        }
    };

    const handleCommentClick = (event) => {
        event.stopPropagation();
        handleCardClick();
    };

    const handleStopPropagation = (event) => {
        event.stopPropagation();
    };

    const canDeletePost = Boolean(currentUsername) && currentUsername === post?.username;

    const handleDeletePost = (event) => {
        event.stopPropagation();
        if (typeof onDeletePost === "function" && post?.id) {
            onDeletePost(post.id);
        }
    };

    const handleShareClick = (event) => {
        event.stopPropagation();
        if (typeof onSharePost === "function" && post?.id) {
            onSharePost(post);
        }
    };

    return (
        <section
            className={`w-full  p-2 h-auto transition-all duration-200 roundeed-lg hover:bg-zinc-950 border-t border-l border-r border-b border-zinc-800 ${onClick ? "cursor-pointer" : ""}`}
            onClick={handleCardClick}
        >
            {post?.reposted_by_label ? (
                <div className="px-3 pt-2 text-zinc-500  font-bold text-sm">
                    <i>{post.reposted_by_label} reposted</i>
                </div>
            ) : null}
            <div className="flex flex-row w-full h-auto gap-4 p-3">
                <div className="flex w-12 h-12 rounded-full overflow-hidden bg-zinc-900">
                    <img
                        src={post?.profile_image || ""}
                        alt="Profile"
                        className="w-full h-full object-cover"
                    />
                    </div>
                    <div className="flex-1">
                    <div className="flex gap-2  items-center">
                        <Link to={`/profile/${post?.username}`} className="font-semibold text-white" onClick={handleStopPropagation}>
                            {post?.display_name || post?.username || "User"}
                        </Link>
                        <Link to={`/profile/${post?.username}`} className="text-zinc-400 text-sm" onClick={handleStopPropagation}>@{post?.username || "unknown"}</Link>
                        {createdAt && <p className="text-zinc-500 text-xs">{createdAt}</p>}
                        <div    
                            className="relative ml-auto mr-3"
                            onMouseEnter={() => setShowSettingsHover(true)}
                            onMouseLeave={() => setShowSettingsHover(false)}
                        >
                            <button
                                type="button"
                                className="p-2 rounded-full transition-all duration-500 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-300"
                                onClick={handleStopPropagation}
                            >
                                <Ellipsis className=" rotate-90  w-7 h-7 ml-9 " />
                            </button>
                            {showSettingsHover ? (
                                <div className="absolute right-0 top-full mt-2 z-20" onClick={handleStopPropagation}>
                                    <PostSettingHover
                                        canDelete={canDeletePost}
                                        onDelete={handleDeletePost}
                                        isDeleting={isDeletingPost}
                                    />
                                </div>
                            ) : null}
                        </div>
                    </div>
                    <p className="text-zinc-200 mt-1 whitespace-pre-wrap">{post?.content}</p>
                    {post?.hashtags && post.hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                            {post.hashtags.map((hashtag) => (
                                <Link
                                    key={hashtag.id}
                                    to={`/hashtag/${hashtag.id}`}
                                    className="text-blue-400 hover:text-blue-300 text-sm"
                                    onClick={handleStopPropagation}
                                >
                                    #{hashtag.tag}
                                </Link>
                            ))}
                        </div>
                    )}
                   
                        {post?.image && (
                        <img src={post.image} alt="Post" className="mt-3 max-h-96 w-full object-cover rounded-2xl" />
                    )}
                    {post?.video && (
                        <video controls className="mt-3 max-h-96 w-full rounded-lg">
                            <source src={post.video} />
                        </video>
                    )}
               </div>
               </div>
               <div className="post-interactions mt-2 mb-2 flex w-full items-center justify-between gap-1 px-2 pl-12 sm:px-3 sm:pl-14 md:gap-2 md:px-4 md:pl-10 overflow-hidden">
                <div className="flex min-w-0 flex-1 items-center justify-center gap-1 md:gap-2 text-zinc-400">
                    <button className="text-zinc-400 hover:text-zinc-500" onClick={handleCommentClick}>
                        <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    <span className="post-interaction-count relative max-[350px]:-left-2 text-zinc-500 -ml-10 sm:-ml-4 md:-ml-2 text-xs sm:text-sm min-w-4 sm:min-w-5 text-right">{commentsCount}</span>
                </div>

                <div className="flex min-w-0 flex-1 items-center justify-center gap-1 md:gap-2 text-zinc-400">
                    <button
                        onClick={(event) => {
                            event.stopPropagation();
                            toggleRepost();
                        }}
                        disabled={repostLoading}
                        className={`transition-colors ${reposted ? "text-green-500" : "text-zinc-400 hover:text-zinc-500"}`}>
                        <Repeat2 className={`w-4 h-4 sm:w-5 sm:h-5 ${reposted ? "fill-current" : ""}`} />
                    </button>
                    <span className="post-interaction-count relative max-[350px]:-left-2 text-zinc-500 -ml-10 sm:-ml-4 md:-ml-2 text-xs sm:text-sm min-w-4 sm:min-w-5 text-right">{repostsCount}</span>
                </div>

                <div className="flex min-w-0 flex-1 items-center justify-center gap-1 md:gap-2 text-zinc-400">
                    <button
                        onClick={(event) => {
                            event.stopPropagation();
                            toggleLike();
                        }}
                        disabled={likeLoading}
                        className={`transition-colors ${liked ? "text-red-500" : "text-zinc-400 hover:text-zinc-500"}`}>
                        <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${liked ? "fill-current" : ""}`} />
                    </button>
                    <span className="post-interaction-count relative max-[350px]:-left-2 text-zinc-500 -ml-10 sm:-ml-4 md:-ml-2 text-xs sm:text-sm min-w-4 sm:min-w-5 text-right">{likesCount}</span>
                </div>

                <div className="flex min-w-0 flex-1 items-center justify-center gap-1 md:gap-2 text-zinc-400">
                    <Kanban className="w-4 h-4 sm:w-5 sm:h-5 -ml-5  rotate-180" />
                    <span className="post-interaction-count relative max-[350px]:-left-2 text-zinc-500 -ml-2  sm:-ml-4 md:-ml-2 text-xs sm:text-sm min-w-4 sm:min-w-5 text-right">{post?.views || 0}</span>
                </div>

                <div className="flex min-w-0 flex-1 items-center justify-center gap-1 md:gap-2 text-zinc-400">
                    <button
                        onClick={(event) => {
                            event.stopPropagation();
                            toggleBookmark();
                        }}
                        disabled={bookmarkLoading}
                        className={`transition-colors ${bookmarked ? "text-blue-500" : "text-zinc-400 hover:text-zinc-500"}`}>
                        <Bookmark className={`w-4 h-4 sm:w-5 ml-1 sm:h-5 ${bookmarked ? "fill-current" : ""}`} />
                    </button>
                    <span className="post-interaction-count relative max-[350px]:-left-2 text-zinc-500 -ml-10 sm:-ml-4 md:-ml-2 text-xs sm:text-sm min-w-4 sm:min-w-5 text-right">{bookmarksCount}</span>
                    <button className="text-zinc-400 hover:text-zinc-500 ml-1 sm:ml-2" onClick={handleShareClick}>
                        <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                </div>

            </div>
        </section>
    );
}

export default PostCard;