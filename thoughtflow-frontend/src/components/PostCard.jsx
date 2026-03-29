import React, { use } from "react";


function PostCard({ post }) {
    const createdAt = post?.created_at ? new Date(post.created_at).toLocaleString() : "";

    return (
        <section className="w-full h-auto border border-zinc-800">
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
                        <p className="font-semibold text-white">{post?.display_name || post?.username || "User"}</p>
                        <p className="text-zinc-400 text-sm">@{post?.username || "unknown"}</p>
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
        </section>
    );
}

export default PostCard;