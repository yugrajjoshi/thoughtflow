import React from "react";
import { useEffect, useState } from "react";
import { Ellipsis, Heart } from "lucide-react";

const API_BASE = "http://127.0.0.1:8000";

const getCleanToken = () => {
    const rawToken = localStorage.getItem("token");
    return rawToken ? rawToken.replace(/^"|"$/g, "").trim() : "";
};

function CommentCard({ comment, postOwnerUsername, currentUsername, postId, onCommentDeleted, onCommentCreated, onClick, depth = 0 }) {
    const createdAt = comment?.created_at ? new Date(comment.created_at).toLocaleString() : "";
    const [showDeleteMenu, setShowDeleteMenu] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [liked, setLiked] = useState(Boolean(comment?.is_liked));
    const [likesCount, setLikesCount] = useState(
        typeof comment?.likes_count === "number" ? comment.likes_count : 0
    );
    const [likeLoading, setLikeLoading] = useState(false);
    const [replies, setReplies] = useState(() => (Array.isArray(comment?.replies) ? comment.replies : []));
    const [showReplyBox, setShowReplyBox] = useState(false);
    const [replyText, setReplyText] = useState("");
    const [isReplying, setIsReplying] = useState(false);

    useEffect(() => {
        setLiked(Boolean(comment?.is_liked));
        setLikesCount(typeof comment?.likes_count === "number" ? comment.likes_count : 0);
        setReplies(Array.isArray(comment?.replies) ? comment.replies : []);
    }, [comment]);

    const canDeleteComment = currentUsername && (
        currentUsername === comment.author_name || 
        currentUsername === postOwnerUsername
    );

    const handleOpenPost = () => {
        if (typeof onClick === "function") {
            onClick(comment);
        }
    };

    const handleLikeComment = async (event) => {
        event.stopPropagation();
        if (!postId || !comment?.id || likeLoading) return;

        const token = getCleanToken();
        if (!token) {
            console.error("No authentication token found");
            return;
        }

        try {
            setLikeLoading(true);
            const response = await fetch(`${API_BASE}/api/posts/${postId}/comments/${comment.id}/like/`, {
                method: "POST",
                headers: {
                    Authorization: "Token " + token,
                },
            });

            if (!response.ok) {
                throw new Error(`Comment like failed with status ${response.status}`);
            }

            const data = await response.json();
            setLiked(Boolean(data?.liked));
            setLikesCount(typeof data?.likes_count === "number" ? data.likes_count : likesCount);
        } catch (error) {
            console.error("Failed to toggle comment like:", error);
        } finally {
            setLikeLoading(false);
        }
    };

    const handleDeleteComment = async () => {
        if (!postId || !comment?.id || isDeleting) return;
        
        const token = getCleanToken();
        if (!token) {
            console.error("No authentication token found");
            return;
        }

        try {
            setIsDeleting(true);
            const response = await fetch(`${API_BASE}/api/posts/${postId}/comments/${comment.id}/`, {
                method: "DELETE",
                headers: {
                    Authorization: "Token " + token,
                },
            });

            if (!response.ok) {
                throw new Error(`Delete failed with status ${response.status}`);
            }

            const data = await response.json();

            if (typeof onCommentDeleted === "function") {
                onCommentDeleted(comment.id, data?.comments_count);
            }
            setShowDeleteMenu(false);
        } catch (error) {
            console.error("Failed to delete comment:", error);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleReplySubmit = async (event) => {
        event.preventDefault();
        event.stopPropagation();

        const trimmedReply = replyText.trim();
        if (!trimmedReply || !postId || !comment?.id || isReplying) {
            return;
        }

        const token = getCleanToken();
        if (!token) {
            console.error("No authentication token found");
            return;
        }

        const formData = new FormData();
        formData.append("content", trimmedReply);
        formData.append("parent_comment_id", comment.id);

        try {
            setIsReplying(true);
            const response = await fetch(`${API_BASE}/api/posts/${postId}/comments/`, {
                method: "POST",
                headers: {
                    Authorization: "Token " + token,
                },
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Reply failed with status ${response.status}`);
            }

            const result = await response.json();
            setReplyText("");
            setShowReplyBox(false);

            if (result?.comment) {
                setReplies((currentReplies) => [result.comment, ...currentReplies]);
            }

            if (typeof onCommentCreated === "function") {
                onCommentCreated(result);
            }
        } catch (error) {
            console.error("Failed to create reply:", error);
        } finally {
            setIsReplying(false);
        }
    };

    const handleChildCommentDeleted = (deletedCommentId, updatedCommentsCount) => {
        setReplies((currentReplies) => currentReplies.filter((reply) => reply.id !== deletedCommentId));
        if (typeof onCommentDeleted === "function") {
            onCommentDeleted(deletedCommentId, updatedCommentsCount);
        }
    };

    const handleChildCommentCreated = (result) => {
        if (typeof onCommentCreated === "function") {
            onCommentCreated(result);
        }
    };

    return (
        <main>
            <div
                className={`w-full h-auto flex flex-col gap-2 p-4  border border-zinc-700 bg-zinc-950/50 shadow relative transition ${typeof onClick === "function" ? "cursor-pointer hover:bg-zinc-900/70" : ""}`}
                role={typeof onClick === "function" ? "button" : undefined}
                tabIndex={typeof onClick === "function" ? 0 : undefined}
                onClick={handleOpenPost}
                onKeyDown={(event) => {
                    if (typeof onClick !== "function") return;
                    if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        handleOpenPost();
                    }
                }}
            >
                {postOwnerUsername && (
                    <div className="text-xs text-zinc-500 mb-2">
                        Replying to{" "}
                        <a 
                            href={`/profile/${postOwnerUsername}`}
                            className="text-blue-400 hover:text-blue-300 cursor-pointer"
                        >
                            @{postOwnerUsername}
                        </a>

                        {typeof onClick === "function" ? (
                            <button
                                type="button"
                                className="mt-1 self-start text-xs font-semibold text-blue-400 hover:text-blue-300 transition"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    handleOpenPost();
                                }}
                            >
                            </button>
                        ) : null}
                    </div>
                )}
                <div className="flex items-start gap-3 justify-between">
                    <div className="flex items-start gap-3 flex-1">
                        <a 
                            href={`/profile/${comment.author_name}`}
                            className={`rounded-full bg-zinc-700 overflow-hidden hover:opacity-80 transition cursor-pointer shrink-0 ${depth > 0 ? 'w-8 h-8' : 'w-10 h-10'}`}
                        >
                            <img 
                                src={comment.profile_image || ""} 
                                alt="Profile" 
                                className="w-full h-full object-cover"
                            />
                        </a>
                        <div className="flex flex-row gap-2 flex-wrap">
                            <a 
                                href={`/profile/${comment.author_name}`}
                                className={`${depth > 0 ? 'text-xs' : 'text-sm'} font-semibold text-zinc-200 hover:text-blue-400 cursor-pointer`}
                            >
                                {comment.author_name}
                            </a>
                            <a 
                                href={`/profile/${comment.author_name}`}
                                className="text-xs text-zinc-500 hover:text-blue-400 cursor-pointer"
                            >
                                @{comment.author_name}
                            </a>
                            <span className="text-xs text-zinc-600">{createdAt}</span>
                        </div>
                    </div>

                    {canDeleteComment && (
                        <div 
                            className="relative"
                            onMouseEnter={() => setShowDeleteMenu(true)}
                            onMouseLeave={() => setShowDeleteMenu(false)}
                        >
                            <button
                                type="button"
                                className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition"
                                onClick={() => setShowDeleteMenu(!showDeleteMenu)}
                            >
                                <Ellipsis className="w-4 h-4" />
                            </button>
                            
                            {showDeleteMenu && (
                                <div className="absolute right-0 top-full mt-1 z-20">
                                    <div className="bg-zinc-900 border border-zinc-700 rounded-lg shadow-lg py-1">
                                        <button
                                            type="button"
                                            onClick={handleDeleteComment}
                                            disabled={isDeleting}
                                            className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-zinc-800 hover:text-red-300 transition disabled:opacity-50 cursor-pointer"
                                        >
                                            {isDeleting ? "Deleting..." : "Delete"}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <p className="text-sm text-zinc-300">{comment.content}</p>

                <div className="flex items-center gap-4 pt-1 text-xs text-zinc-400">
                    <button
                        type="button"
                        onClick={handleLikeComment}
                        className={`inline-flex items-center gap-1 transition ${liked ? "text-red-400 hover:text-red-300" : "text-zinc-400 hover:text-zinc-200"}`}
                        disabled={likeLoading}
                    >
                        <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} />
                        <span>{likeLoading ? "..." : likesCount}</span>
                    </button>
                    <button
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation();
                            setShowReplyBox((current) => !current);
                        }}
                        className="text-zinc-400 hover:text-zinc-200 transition"
                    >
                        Reply{replies.length > 0 ? ` (${replies.length})` : ""}
                    </button>
                </div>

                {showReplyBox && (
                    <form className="flex flex-col gap-2 pt-2" onSubmit={handleReplySubmit}>
                        <textarea
                            value={replyText}
                            onChange={(event) => setReplyText(event.target.value)}
                            placeholder={`Reply to @${comment.author_name}`}
                            className="w-full min-h-20 rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowReplyBox(false);
                                    setReplyText("");
                                }}
                                className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-900"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isReplying || !replyText.trim()}
                                className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                            >
                                {isReplying ? "Replying..." : "Reply"}
                            </button>
                        </div>
                    </form>
                )}

                {replies.length > 0 ? (
                    <div className={
                        `mt-3 flex flex-col gap-3 ${depth === 0 ? 'border-l border-zinc-800 pl-4' : 'border-l-2 border-zinc-700 pl-3'}`
                    }>
                        {replies.map((reply) => (
                            <CommentCard
                                key={reply.id}
                                comment={reply}
                                postOwnerUsername={postOwnerUsername}
                                currentUsername={currentUsername}
                                postId={postId}
                                onCommentDeleted={handleChildCommentDeleted}
                                onCommentCreated={handleChildCommentCreated}
                                depth={depth + 1}
                            />
                        ))}
                    </div>
                ) : null}
                
                {comment.image_url && (
                    <img 
                        src={comment.image_url} 
                        alt="Comment image" 
                        className="mt-2 max-h-64 w-full object-cover rounded-lg border border-zinc-700"
                    />
                )}
                
                {comment.video_url && (
                    <video 
                        controls 
                        className="mt-2 max-h-64 w-full rounded-lg border border-zinc-700"
                    >
                        <source src={comment.video_url} />
                    </video>
                )}
            </div>
        </main>
    )};

    export default CommentCard;