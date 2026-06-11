import React from "react";
import { Link2, VolumeX, Ban, Flag, Trash2 } from "lucide-react";

function PostSettingHover({ 
    username = "", 
    canDelete = false, 
    onDelete, 
    isDeleting = false,
    onCopyLink,
    onMute,
    onBlock,
    onReport
}) {
    // Truncate username if it's too long
    const displayUsername = username.length > 12 ? `${username.slice(0, 10)}...` : username;

    return (
        <div className="w-48 sm:w-56 rounded-xl border border-zinc-800 bg-zinc-950/98 shadow-2xl overflow-hidden py-1.5 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150">
            {/* Copy Link */}
            <button 
                type="button" 
                onClick={onCopyLink}
                className="w-full text-left px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-zinc-200 hover:bg-zinc-900 hover:text-white transition-colors flex items-center gap-2.5"
            >
                <Link2 size={16} className="text-zinc-400" />
                <span>Copy link</span>
            </button>

            {/* Mute User */}
            {!canDelete && (
                <button 
                    type="button" 
                    onClick={onMute}
                    className="w-full text-left px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-zinc-200 hover:bg-zinc-900 hover:text-white border-t border-zinc-900 transition-colors flex items-center gap-2.5"
                >
                    <VolumeX size={16} className="text-zinc-400" />
                    <span>Mute @{displayUsername}</span>
                </button>
            )}

            {/* Block User */}
            {!canDelete && (
                <button 
                    type="button" 
                    onClick={onBlock}
                    className="w-full text-left px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 border-t border-zinc-900 transition-colors flex items-center gap-2.5"
                >
                    <Ban size={16} className="text-red-400/80" />
                    <span>Block @{displayUsername}</span>
                </button>
            )}

            {/* Report Post */}
            {!canDelete && (
                <button 
                    type="button" 
                    onClick={onReport}
                    className="w-full text-left px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 border-t border-zinc-900 transition-colors flex items-center gap-2.5"
                >
                    <Flag size={16} className="text-red-400/80" />
                    <span>Report post</span>
                </button>
            )}

            {/* Delete Post (Conditional) */}
            {canDelete ? (
                <button
                    type="button"
                    onClick={onDelete}
                    disabled={isDeleting}
                    className="w-full text-left px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-red-500 hover:bg-red-650/15 hover:text-red-400 border-t border-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2.5"
                >
                    <Trash2 size={16} className="text-red-500/80" />
                    <span>{isDeleting ? "Deleting..." : "Delete post"}</span>
                </button>
            ) : null}
        </div>
    );
}

export default PostSettingHover;