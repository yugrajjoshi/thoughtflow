import React from "react";
import { Heart, MessageCircle, Bookmark, Share2, Kanban } from "lucide-react";
import { useState } from "react";



function PostCard({ post }) {
    const createdAt = post?.created_at ? new Date(post.created_at).toLocaleString() : "";
    const [liked, setLiked] = useState(false);
    const [bookmarked, setBookmarked] = useState(false);



    const toggleLike = () => {
        setLiked((prev) => !prev);
    };
   const toggleBookmark = () => {
        setBookmarked((prev) => !prev);
    };

    return (
        <section className="w-full mt-2 mb-2 h-auto border border-zinc-800">
            <div className="flex flex-row w-full h-auto gap-4 p-3">
                <div className="flex w-12 h-12 rounded-full overflow-hidden bg-zinc-900">
                    <img
                        src={post?.profile_image || ""}
                        alt="Profile"
                        className="w-full h-full object-cover"
                    />
                </div>
                <div className="flex-1">
                    <div className="flex gap-2 items-center">
                        <a href={`/profile/${post?.username}`} className="font-semibold text-white">
                            {post?.display_name || post?.username || "User"}
                        </a>
                        <a href={`/profile/${post?.username}`} className="text-zinc-400 text-sm">@{post?.username || "unknown"}</a>
                        {createdAt && <p className="text-zinc-500 text-xs">{createdAt}</p>}
                    </div>
                    <p className="text-zinc-200 mt-1 whitespace-pre-wrap">{post?.content}</p>
                    {post?.image && (
                        <img src={post.image} alt="Post" className="mt-3 max-h-96 w-full object-cover rounded-lg" />
                    )}
                    {post?.video && (
                        <video controls className="mt-3 max-h-96 w-full rounded-lg">
                            <source src={post.video} />
                        </video>
                    )}
                </div>
            </div>
            <div className="flex border-t-[0.5px] border-b-[0.5px] mt-4 border-zinc-800 justify-between gap-5 pr-5 pl-5 w-full p-3">
                <button 
                onClick={toggleLike}
                className={`transition-colors ${liked ? "text-red-500  " : "text-zinc-400 hover:text-zinc-500"}`}>
                    <Heart className={`w-5 h-5 ${liked ? "fill-current" : ""}`} />
                </button>
                <button className="text-zinc-400 hover:text-zinc-500">
                    <MessageCircle className="w-5 h-5" />
                </button>
                <button 
                onClick={toggleBookmark}
                className={`transition-colors ${bookmarked ? "text-blue-500" : "text-zinc-400 hover:text-zinc-500"}`}>
                    <Bookmark className={`w-5 h-5 ${bookmarked ? "fill-current" : ""}`} />
                </button>
                <span className="text-zinc-400 flex gap-1 text-sm" >
                    <Kanban className="w-5 h-5  rotate-180"/>
                    {post?.views || 0}
                </span>
                <button className="text-zinc-400  hover:text-zinc-500">
                    <Share2 className="w-5 h-5" />
                </button>
            </div>
        </section>
    );
}

export default PostCard;