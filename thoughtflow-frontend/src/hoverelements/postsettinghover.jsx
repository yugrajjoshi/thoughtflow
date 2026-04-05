import React from "react";

function PostSettingHover() {
    return (
        <div className="w-52 rounded-xl border border-zinc-700 bg-zinc-950/95 shadow-xl overflow-hidden">
            <button type="button" className="w-full text-left px-4 py-3 text-sm text-zinc-200 hover:bg-zinc-800/80">
                Post settings
            </button>
            <button type="button" className="w-full text-left px-4 py-3 text-sm text-zinc-200 hover:bg-zinc-800/80 border-t border-zinc-800">
                Mute this user
            </button>
            <button type="button" className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-zinc-800/80 border-t border-zinc-800">
                Report post
            </button>
        </div>
    );
}

export default PostSettingHover;