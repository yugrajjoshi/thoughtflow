import React from "react";

const API_BASE = "http://127.0.0.1:8000";

const getMediaSrc = (value) => {
  if (!value) return "";
  return value.startsWith("http") ? value : `${API_BASE}${value}`;
};

function SharedPostPreview({ post, onOpenPost }) {
  const username = post?.username || "unknown";
  const displayName = post?.display_name || post?.displayName || username;
  const profileImage = getMediaSrc(post?.profile_image || post?.profileImage || "");
  const imageSrc = getMediaSrc(post?.image_url || post?.image || "");
  const videoSrc = getMediaSrc(post?.video_url || post?.video || "");
  const content = typeof post?.content === "string" ? post.content : "";

  const handleOpen = () => {
    if (typeof onOpenPost === "function" && post?.id) {
      onOpenPost(post);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleOpen();
        }
      }}
      className="mt-2 w-full overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/90 text-left transition hover:border-zinc-700 hover:bg-zinc-900/80"
    >
      <div className="flex items-center gap-3 border-b border-zinc-800 px-3 py-3">
        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-zinc-800">
          {profileImage ? <img src={profileImage} alt={username} className="h-full w-full object-cover" /> : null}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{displayName}</p>
          <p className="truncate text-xs text-zinc-500">@{username}</p>
        </div>
      </div>

      <div className="px-3 py-3">
        {content ? <p className="text-sm text-zinc-200 whitespace-pre-wrap wrap-break-word">{content}</p> : null}

        {imageSrc ? (
          <img src={imageSrc} alt="Shared post media" className="mt-3 max-h-56 w-full rounded-xl object-cover" />
        ) : null}

        {videoSrc ? (
          <video controls className="mt-3 max-h-56 w-full rounded-xl">
            <source src={videoSrc} />
          </video>
        ) : null}
      </div>
    </div>
  );
}

export default SharedPostPreview;
