import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader } from "lucide-react";
import PostCard from "../components/PostCard";

const API_BASE = "http://127.0.0.1:8000";

const getCleanToken = () => {
    const rawToken = localStorage.getItem("token");
    return rawToken ? rawToken.replace(/^"|"$/g, "").trim() : "";
};

function HashtagPage() {
    const { hashtagId } = useParams();
    const navigate = useNavigate();
    const [hashtag, setHashtag] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [currentUsername, setCurrentUsername] = useState(null);
    const [deletingPostId, setDeletingPostId] = useState(null);

    useEffect(() => {
        fetchCurrentUser();
        fetchHashtagDetails();
        fetchHashtagPosts();
    }, [hashtagId]);

    const fetchCurrentUser = async () => {
        const token = getCleanToken();
        if (!token) return;

        try {
            const response = await fetch(`${API_BASE}/api/user/`, {
                headers: {
                    Authorization: "Token " + token,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setCurrentUserId(data.id);
                setCurrentUsername(data.username);
            }
        } catch (err) {
            console.error("Error fetching current user:", err);
        }
    };

    const fetchHashtagDetails = async () => {
        const token = getCleanToken();
        if (!token) return;

        try {
            const response = await fetch(`${API_BASE}/api/hashtags/${hashtagId}/`, {
                headers: {
                    Authorization: "Token " + token,
                },
            });

            if (!response.ok) {
                throw new Error("Hashtag not found");
            }

            const data = await response.json();
            setHashtag(data);
        } catch (err) {
            console.error("Error fetching hashtag details:", err);
            setError(err.message);
        }
    };

    const fetchHashtagPosts = async () => {
        const token = getCleanToken();
        if (!token) return;

        try {
            setLoading(true);
            const response = await fetch(`${API_BASE}/api/hashtags/${hashtagId}/posts/?limit=50`, {
                headers: {
                    Authorization: "Token " + token,
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch hashtag posts");
            }

            const data = await response.json();
            setPosts(data);
        } catch (err) {
            console.error("Error fetching hashtag posts:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePost = async (postId) => {
        const token = getCleanToken();
        if (!token) return;

        try {
            setDeletingPostId(postId);
            const response = await fetch(`${API_BASE}/api/posts/${postId}/`, {
                method: "DELETE",
                headers: {
                    Authorization: "Token " + token,
                },
            });

            if (response.ok) {
                setPosts(posts.filter((p) => p.id !== postId));
            } else {
                throw new Error("Failed to delete post");
            }
        } catch (err) {
            console.error("Error deleting post:", err);
        } finally {
            setDeletingPostId(null);
        }
    };

    const handlePostUpdated = (postId, updates) => {
        setPosts(
            posts.map((p) =>
                p.id === postId ? { ...p, ...updates } : p
            )
        );
    };

    if (error) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <p className="text-zinc-400 mb-4">{error}</p>
                    <button
                        onClick={() => navigate("/")}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black flex">
            <div className="w-full max-w-2xl mx-auto border-l border-r border-zinc-800">
                {/* Header */}
                <div className="sticky top-0 z-10 bg-black/80 backdrop-blur border-b border-zinc-800 p-4">
                    <div className="flex items-center gap-4 mb-3">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 hover:bg-zinc-900 rounded-full transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-white" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-white">
                                #{hashtag?.tag || "Loading..."}
                            </h1>
                            {hashtag && (
                                <p className="text-zinc-400 text-sm">
                                    {hashtag.posts_count} posts
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Posts */}
                {loading ? (
                    <div className="flex justify-center items-center py-8">
                        <Loader className="w-8 h-8 text-blue-500 animate-spin" />
                    </div>
                ) : posts.length > 0 ? (
                    <div>
                        {posts.map((post) => (
                            <PostCard
                                key={post.id}
                                post={post}
                                currentUserId={currentUserId}
                                currentUsername={currentUsername}
                                onDeletePost={handleDeletePost}
                                onPostUpdated={handlePostUpdated}
                                isDeletingPost={deletingPostId === post.id}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-zinc-400">No posts found for this hashtag</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default HashtagPage;
