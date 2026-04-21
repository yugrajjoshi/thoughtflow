import React from "react";
import { MessageSquareText, Phone, MoreHorizontal } from "lucide-react";


const API_BASE = "http://127.0.0.1:8000";

const getCleanToken = () => {
    const rawToken = localStorage.getItem("token");
    return rawToken ? rawToken.replace(/^"|"$/g, "").trim() : "";
};

const getUserImage = (selectedUser) => {
    const image = selectedUser?.profileImage || selectedUser?.profile_image || "";
    if (!image) {
        return "";
    }

    return image.startsWith("http") ? image : `${API_BASE}${image}`;
};

function MassangerSection({ selectedUser }) {
    const profileImage = getUserImage(selectedUser);
    const displayName = selectedUser?.displayName || selectedUser?.name || selectedUser?.username || "";
    const username = selectedUser?.username || "";

    return (
        <main className="w-full p-2 h-full flex flex-col">
            <div className="border border-zinc-800 w-full min-h-20 px-4 py-3 flex items-center justify-between">
                {selectedUser ? (
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-800 shrink-0">
                            {profileImage ? (
                                <img
                                    src={profileImage}
                                    alt={username || "Selected user"}
                                    className="w-full h-full object-cover"
                                />
                            ) : null}
                        </div>
                        <div className="min-w-0">
                            <p className="text-white font-semibold truncate">{displayName}</p>
                            <p className="text-sm text-zinc-400 truncate">@{username}</p>
                        </div>
                    </div>
                ) : (
                    <p className="text-zinc-500 text-sm">Search and select a user to start chatting.</p>
                )}

                <div className="flex items-center gap-2 text-zinc-400">
                    <button type="button" className="p-2 hover:text-white transition"><Phone size={18} /></button>
                    <button type="button" className="p-2 hover:text-white transition"><MessageSquareText size={18} /></button>
                    <button type="button" className="p-2 hover:text-white transition"><MoreHorizontal size={18} /></button>
                </div>
            </div>

        </main>
    );
}

export default MassangerSection;