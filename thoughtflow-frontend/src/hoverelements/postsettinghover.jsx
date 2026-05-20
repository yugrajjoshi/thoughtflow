import React from "react";

function PostSettingHover({ canDelete = false, onDelete, isDeleting = false }) {
    return (
        <div className="w-40 sm:w-52 rounded-lg sm:rounded-xl border border-zinc-700 bg-zinc-950/95 shadow-lg sm:shadow-xl overflow-hidden">
            <button type="button" className="w-full text-left px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-zinc-200 hover:bg-zinc-800/80 transition-colors">
                Post settings
            </button>
            <button type="button" className="w-full text-left px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-zinc-200 hover:bg-zinc-800/80 border-t border-zinc-800 transition-colors">
                Mute this user
            </button>
            <button type="button" className="w-full text-left px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-red-400 hover:bg-zinc-800/80 border-t border-zinc-800 transition-colors">
                Report post
            </button>
            {canDelete ? (
                <button
                    type="button"
                    onClick={onDelete}
                    disabled={isDeleting}
                    className="w-full text-left px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-red-500 hover:bg-zinc-800/80 border-t border-zinc-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                    {isDeleting ? "Deleting..." : "Delete post"}
                </button>
            ) : null}
            
        </div>
    );
}

export default PostSettingHover;