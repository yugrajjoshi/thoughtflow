import React from "react";
import { Repeat } from "lucide-react";
import PostCard from "./PostCard";

function RepostedPost({ originalPost }) {
    return (
        <main className="flex flex-col border items-center justify-center h-auto">
            <div className="w-full p-2 text-lg font-bold text-zinc-500">
                <h1>
                    <i className="inline-flex flex-row gap-2 items-center ">
                        <Repeat className="rotate-90 h-4 w-4 text-zinc-500" />
                        reposted this
                    </i>
                </h1>
            </div>
            <PostCard post={originalPost} />
        </main>
    );
}

export default RepostedPost;