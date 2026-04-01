import React from "react";
import { useState } from "react";


function CommentCard({ comment }) {
    const createdAt = comment?.created_at ? new Date(comment.created_at).toLocaleString() : "";
    return (
        <main>
            
        </main>
    )};

    export default CommentCard;