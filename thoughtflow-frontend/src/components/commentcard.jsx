import React from "react";
import { useState } from "react";
import { Ellipsis, X } from "lucide-react";

const API_BASE = "http://127.0.0.1:8000";

const getCleanToken = () => {
    const rawToken = localStorage.getItem("token");
    return rawToken ? rawToken.replace(/^"|"$/g, "").trim() : "";
};

function CommentCard({ comment, postOwnerUsername, currentUsername, postId, onCommentDeleted }) {
    const createdAt = comment?.created_at ? new Date(comment.created_at).toLocaleString() : "";
    const [showDeleteMenu, setShowDeleteMenu] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const canDeleteComment = currentUsername && (
        currentUsername === comment.author_name || 
        currentUsername === postOwnerUsername
    );

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

            if (onCommentDeleted) {
                onCommentDeleted(comment.id);
            }
            setShowDeleteMenu(false);
        } catch (error) {
            console.error("Failed to delete comment:", error);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <main>
            <div className="w-full h-auto flex flex-col gap-2 p-4 rounded-lg border border-zinc-700 bg-zinc-950/50 shadow relative">
                {postOwnerUsername && (
                    <div className="text-xs text-zinc-500 mb-2">
                        Replying to{" "}
                        <a 
                            href={`/profile/${postOwnerUsername}`}
                            className="text-blue-400 hover:text-blue-300 cursor-pointer"
                        >
                            @{postOwnerUsername}
                        </a>
                    </div>
                )}
                <div className="flex items-start gap-3 justify-between">
                    <div className="flex items-start gap-3 flex-1">
                        <a 
                            href={`/profile/${comment.author_name}`}
                            className="w-10 h-10 rounded-full bg-zinc-700 overflow-hidden hover:opacity-80 transition cursor-pointer shrink-0"
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
                                className="text-sm font-semibold text-zinc-200 hover:text-blue-400 cursor-pointer"
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