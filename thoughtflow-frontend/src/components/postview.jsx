import React, { useState } from "react";
import { ArrowLeft, MessageCircle } from "lucide-react";
import PostCard from "./PostCard";
import CommentCard from "./commentcard";
import CreateCommentCard from "./CreateCommentCard";

function PostView({ post, onBack, currentUsername, currentUserId, currentUserProfilePicture, onDeletePost, onPostUpdated, isDeletingPost }) {
	const [comments, setComments] = useState(post?.comments || []);
	const createdAt = post?.created_at ? new Date(post.created_at).toLocaleString() : "";
	const postData = {
		...post,
		comments,
		comments_count: comments.length,
	};

	const handleCommentCreated = async (result) => {
		if (result?.comment) {
			setComments((currentComments) => {
				const nextComments = [result.comment, ...currentComments];
				if (typeof onPostUpdated === "function" && post?.id) {
					onPostUpdated(post.id, {
						comments_count: result?.comments_count ?? nextComments.length,
					});
				}
				return nextComments;
			});
		}
	};

	const handleCommentDeleted = (deletedCommentId) => {
		setComments((currentComments) => {
			const nextComments = currentComments.filter((comment) => comment.id !== deletedCommentId);
			if (typeof onPostUpdated === "function" && post?.id) {
				onPostUpdated(post.id, {
					comments_count: nextComments.length,
				});
			}
			return nextComments;
		});
	};

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
				post={postData}
				className="w-full "
				currentUsername={currentUsername}
				currentUserId={currentUserId}
				onDeletePost={onDeletePost}
				onPostUpdated={(postId, changes) => {
					if (typeof onPostUpdated === "function") {
						onPostUpdated(postId, changes);
					}
				}}
				isDeletingPost={isDeletingPost}
			/>
              {createdAt && <h3 className="text-zinc-400 font-semibold text-md ml-2 -m-3 ">{createdAt}</h3>}

			<CreateCommentCard 
				postId={post?.id}
				profilePicture={currentUserProfilePicture}
				postOwnerUsername={post?.username}
				currentUsername={currentUsername}
				onCommentCreated={handleCommentCreated}
			/>
			
			<section className="flex flex-col gap-3 border-t border-zinc-800 pt-4">
				<div className="flex items-center gap-2 text-zinc-300">
					<MessageCircle className="w-5 h-5" />
					<h3 className="text-base font-semibold">Replies ({comments.length})</h3>
				</div>

				{comments && comments.length > 0 ? (
					<div className="flex flex-col gap-3">
						{comments.map((comment) => (
							<CommentCard 
								key={comment.id} 
								comment={comment} 
								postOwnerUsername={post?.username}
								currentUsername={currentUsername}
								postId={post?.id}
								onCommentDeleted={handleCommentDeleted}
							/>
						))}
					</div>
				) : (
					<div className="rounded-lg border border-dashed border-zinc-800 bg-zinc-950 p-4 text-zinc-500">
						No replies yet. Be the first to reply!
					</div>
				)}
			</section>
		</main>
	);
}

export default PostView;
