import React from "react";
import { useState, useEffect } from "react";
import PostCard from "./PostCard";
import CommentCard from "./commentcard";

function CommentView({ postId }) {
    const [post, setPost] = useState(null);
    const [comments, setComments] = useState([]);

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