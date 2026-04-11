import React from "react";
import { useState } from "react";

function CreateComment({ postId, onCommentCreated }) {
    const [commentText, setCommentText] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!commentText.trim()) return;

        try {
            setIsSubmitting(true);
            await onCommentCreated(commentText);
            setCommentText("");
        } catch (error) {
            console.error("Error submitting comment:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return ( 
        <main>
            <div className="w-full h-auto flex flex-col gap-2 p-4 rounded-xl border border-zinc-700 bg-zinc-950/95 shadow">
                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                    <textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Write a comment..."
                        className="w-full px-3 py-2 bg-zinc-900 text-zinc-300 placeholder:text-zinc-500 border border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none min-h-24"
                    />
                    <button
                        type="submit"
                        disabled={isSubmitting || !commentText.trim()}
                        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors"
                    >
                        {isSubmitting ? "Posting..." : "Post Comment"}
                    </button>
                </form>
            </div>
        </main>
    );
}

export default CreateComment;