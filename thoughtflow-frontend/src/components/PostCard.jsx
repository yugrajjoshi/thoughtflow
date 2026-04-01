import React from "react";
import { Heart, MessageCircle, Bookmark, Share2, Kanban,Repeat2 } from "lucide-react";
import { useState } from "react";



function PostCard({ post }) {
    const createdAt = post?.created_at ? new Date(post.created_at).toLocaleString() : "";
    const [liked, setLiked] = useState(false);
    const [reposted, setReposted] = useState(false);
    const [bookmarked, setBookmarked] = useState(false);
    const likesCount = typeof post?.likes_count === "number"
        ? post.likes_count
        : Array.isArray(post?.likes)
            ? post.likes.length
            : 0;
    const repostsCount = typeof post?.reposts_count === "number"
        ? post.reposts_count
        : Array.isArray(post?.reposts)
            ? post.reposts.length
            : 0;
    const commentsCount = typeof post?.comments_count === "number" ? post.comments_count : 0;


  
    

    const toggleLike = () => {
        setLiked((prev) => !prev);
    };
    const toggleRepost = () => {
        setReposted((prev) => !prev);
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
            <div className="flex   ml-18 mt-10 border-zinc-800 justify-between gap-5 pr-5  w-[90%] p-3">
                <div className="flex gap-2 justify-center items-center" >
                <button className="text-zinc-400 hover:text-zinc-500">
                    <MessageCircle className="w-5 h-5" />
                </button>
                <span className="text-zinc-600" >{commentsCount}</span>
                </div>
                <div className="flex gap-2 justify-center items-center" >
                <button 
                onClick={toggleRepost}
                className={`flex gap-2 transition-colors ${reposted ? "text-green-500" : "text-zinc-400 hover:text-zinc-500"}`}>
                    <Repeat2 className={`w-5 h-5 ${reposted ? "fill-current" : ""}`} />
                </button>
                <span className="text-zinc-600" >{repostsCount}</span>
                </div>
                <div className="flex gap-2 justify-center items-center" >
                <button 
                onClick={toggleLike}
                className={`flex gap-2 transition-colors ${liked ? "text-red-500  " : "text-zinc-400 hover:text-zinc-500"}`}>
                    <Heart className={`w-5 h-5 ${liked ? "fill-current" : ""}`} />
                </button>
                <span className="text-zinc-600" >{likesCount}</span>
                </div>
                
                <span className="text-zinc-400 flex gap-1 text-sm" >
                    <Kanban className="w-5 h-5  rotate-180"/>
                    {post?.views || 0}
                </span>
                <div className="flex gap-2 justify-center items-center" >
                <div className="flex gap-5">
                <button 
                onClick={toggleBookmark}
                className={`transition-colors ${bookmarked ? "text-blue-500" : "text-zinc-400 hover:text-zinc-500"}`}>
                    <Bookmark className={`w-5 h-5 ${bookmarked ? "fill-current" : ""}`} />
                </button>
                </div>
                <button className="text-zinc-400  hover:text-zinc-500">
                    <Share2 className="w-5 h-5" />
                </button>
                </div>
            </div>
        </section>
    );
}

export default PostCard;