import React from "react";
import { ArrowLeft, MessageCircle } from "lucide-react";
import PostCard from "./PostCard";
import CommentView from "./commentViews";
import CommentCard from "./commentcard";

function PostView({ post, onBack, currentUsername, onDeletePost, isDeletingPost }) {
	const commentText = typeof post?.comments === "string" ? post.comments.trim() : "";
    const createdAt = post?.created_at ? new Date(post.created_at).toLocaleString() : "";

	return (
		<main className="w-full h-full flex flex-col gap-4 p-4 text-white">
			<div className="flex items-center gap-3 sticky top-0 z-10 bg-black/95 backdrop-blur border-b border-zinc-800 pb-3">
				<button
					type="button"
					onClick={onBack}
					className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-zinc-900 text-zinc-300"
				>
					<ArrowLeft className="w-5 h-5" />
				</button>
				<div className="items-center p-2 " >
					<h2 className="text-2xl font-bold">Post</h2>
				</div>
			</div>

			<PostCard
				post={post}
				className="w-full "
				currentUsername={currentUsername}
				onDeletePost={onDeletePost}
				isDeletingPost={isDeletingPost}
			/>
              {createdAt && <h3 className="text-zinc-400 font-semibold text-md ml-2 -m-3 ">{createdAt}</h3>} 
			<section className="flex flex-col gap-3 border-t border-zinc-800 pt-4">
				<div className="flex items-center gap-2 text-zinc-300">
					<MessageCircle className="w-5 h-5" />
					<h3 className="text-base font-semibold">Comments</h3>
				</div>

				{commentText ? (
					<div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-zinc-200">
						{commentText}
					</div>
				) : (
					<div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950 p-4 text-zinc-500">
						No comments available yet.
					</div>
				)}
              <CommentCard comment={post.comments} />
			</section>
		</main>
	);
}

export default PostView;
