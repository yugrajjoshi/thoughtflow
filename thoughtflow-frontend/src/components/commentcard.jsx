import React from "react";
import { useState } from "react";


function CommentCard({ comment }) {
    const createdAt = comment?.created_at ? new Date(comment.created_at).toLocaleString() : "";
    return (
        <main>
            <div className="w-full h-auto flex flex-col gap-2 p-4 rounded-xl border border-zinc-700 bg-zinc-950/95 shadow">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-700"></div>
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold text-zinc-200">{comment.author_name}</span>
                        <span className="text-xs text-zinc-500">{createdAt}</span>
                    </div>
                </div>
                <p className="text-sm text-zinc-300">{comment.content}</p>
            </div>
        </main>
    )};

    export default CommentCard;