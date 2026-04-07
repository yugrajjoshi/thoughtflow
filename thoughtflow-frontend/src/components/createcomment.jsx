import React from "react";
import { useState } from "react";

function CreateComment({ postId, onCommentCreated }) {
    const [commentText, setCommentText] = useState("");




return ( 
    <main>
        <div className="w-full h-auto flex flex-col gap-2 p-4 rounded-xl border border-zinc-700 bg-zinc-950/95 shadow">
            <form onSubmit={(e) => {
                e.preventDefault();
                onCommentCreated(commentText);
                setCommentText("");
            }}>
            <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                className="bg-zinc-900 text-zinc-300 placeholder:text-zinc-500 border border-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            
        </form>
        </div>
    </main>
);




}



export default CreateComment;