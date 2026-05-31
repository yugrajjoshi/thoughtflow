import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { TrendingUp } from "lucide-react";
import API_BASE from '../config';

const getCleanToken = () => {
    const rawToken = localStorage.getItem("token");
    return rawToken ? rawToken.replace(/^"|"$/g, "").trim() : "";
};

function TrendingHashtags() {
    const [hashtags, setHashtags] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchTrendingHashtags();
    }, []);

    const fetchTrendingHashtags = async () => {
        const token = getCleanToken();
        if (!token) {
            setError("Not authenticated");
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(`${API_BASE}/api/hashtags/trending/?limit=10`, {
                headers: {
                    Authorization: "Token " + token,
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch trending hashtags");
            }

            const data = await response.json();
            setHashtags(data);
        } catch (err) {
            console.error("Error fetching trending hashtags:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <p className="text-zinc-500 text-sm px-1 py-2">Loading trending hashtags...</p>
        );
    }

    if (error || hashtags.length === 0) {
        return null;
    }

    return (
        <div className="space-y-2">
            {hashtags.map((hashtag) => (
                <Link
                    key={hashtag.id}
                    to={`/hashtag/${hashtag.id}`}
                    className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/70 px-3 py-3 transition-colors hover:bg-zinc-900/90"
                >
                    <div className="min-w-0">
                        <p className="text-blue-400 font-medium truncate">#{hashtag.tag}</p>
                        <p className="text-zinc-500 text-sm mt-1">{hashtag.posts_count} posts</p>
                    </div>
                    <TrendingUp className="w-4 h-4 text-blue-400 shrink-0" />
                </Link>
            ))}
        </div>
    );
}

export default TrendingHashtags;
