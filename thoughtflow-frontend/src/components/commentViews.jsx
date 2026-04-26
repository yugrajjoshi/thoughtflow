import React from "react";
import { useState } from "react";
import PostCard from "./PostCard";
import CommentCard from "./commentcard";

function CommentView() {
    const [post] = useState(null);
    const [comments] = useState([]);

    return(
        <main className="w-full h-auto flex flex-col gap-5">
            {post && <PostCard post={post} />}
            <div className="flex flex-col gap-3">
                {comments.map((comment) => (
                    <CommentCard key={comment.id} comment={comment} />
                ))}
            </div>
        </main>
    )};


    export default CommentView; 