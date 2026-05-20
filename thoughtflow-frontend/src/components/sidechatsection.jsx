import React, { useState } from "react";
import { Search, X, MoreHorizontal } from "lucide-react";

const API_BASE = "http://127.0.0.1:8000";

function SideChatsection({
  conversations = [],
  searchQuery = "",
  onSearchChange = () => {},
  onSelectUser = () => {},
  selectedUsername = "",
  newChatPeople = [],
  onStartNewChat = () => {},
  isLoadingPeople = false,
  onDeleteConversation = () => {},
  onToggleMuteConversation = () => {},
}) {
  const [openMenuFor, setOpenMenuFor] = useState(null);
  const containerRef = React.useRef(null);
  React.useEffect(() => {
    function handleDocClick(e) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target)) {
        setOpenMenuFor(null);
      }
    }
    document.addEventListener('mousedown', handleDocClick);
    return () => document.removeEventListener('mousedown', handleDocClick);
  }, [containerRef]);
  const getProfileImageUrl = (imagePath) => {
    if (!imagePath) return "";
    if (imagePath.startsWith("http")) return imagePath;
    return `${API_BASE}${imagePath}`;
  };

  const getTimeDisplay = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "now";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    
    return date.toLocaleDateString();
  };

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col bg-black text-white">
      {/* Search Bar */}
      <div className="shrink-0 p-4 border-b border-zinc-700">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-3 py-2 bg-zinc-900 border border-zinc-700 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length > 0 ? (
          <div className="divide-y divide-zinc-800">
            {conversations.map((person) => {
              const isSelected = selectedUsername === person.username;
              const profileImage = getProfileImageUrl(person.profileImage);
              const lastMessagePreview = person.lastMessage
                ? person.lastMessage.length > 40
                  ? person.lastMessage.substring(0, 40) + "..."
                  : person.lastMessage
                : "No messages yet";

              return (
                <div
                  key={person.conversationId}
                  onClick={() => onSelectUser(person)}
                  role="button"
                  tabIndex={0}
                  className={`w-full p-3 transition ${isSelected ? "bg-zinc-900" : "hover:bg-zinc-900/50"}`}
                >
                  <div className="flex items-center gap-3">
                    {profileImage ? (
                      <img
                        src={profileImage}
                        alt={person.displayName}
                        className="w-12 h-12 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-zinc-700 flex items-center justify-center text-sm font-medium shrink-0">
                        {person.displayName?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="font-semibold truncate">{person.displayName}</p>
                        <span className="text-xs text-zinc-500 shrink-0">
                          {getTimeDisplay(person.lastMessageAt)}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-400 truncate">
                        {lastMessagePreview}
                      </p>
                    </div>

                    <div className="ml-2 flex items-center gap-2">
                      {person.unreadCount > 0 && (
                        <div className="shrink-0 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                          {person.unreadCount > 99 ? "99+" : person.unreadCount}
                        </div>
                      )}

                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setOpenMenuFor(openMenuFor === person.conversationId ? null : person.conversationId); }}
                          className="p-2 rounded-full hover:bg-zinc-800/60"
                          aria-label="Conversation options"
                        >
                          <MoreHorizontal className="w-4 h-4 text-zinc-400" />
                        </button>

                        {openMenuFor === person.conversationId ? (
                          <div className="absolute z-50 top-full mt-2 left-0 sm:right-0 sm:left-auto w-44 sm:w-40 rounded-lg border border-zinc-800 bg-black p-2 flex flex-col gap-1 shadow-lg">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setOpenMenuFor(null); onToggleMuteConversation(person.conversationId); }}
                              className="text-sm text-zinc-200 text-left px-3 py-2 hover:bg-zinc-900/80 rounded transition-colors"
                            >
                              {person.muted ? '✓ Unmute' : 'Mute'}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setOpenMenuFor(null); onDeleteConversation(person.conversationId); }}
                              className="text-sm text-red-400 text-left px-3 py-2 hover:bg-zinc-900/80 rounded transition-colors"
                            >
                              Delete Chat
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : searchQuery.trim() === "" ? (
          <div className="flex items-center justify-center h-full text-zinc-500">
            <p>No conversations yet</p>
          </div>
        ) : null}

        {/* New Chats Suggestions */}
        {searchQuery.trim() !== "" && conversations.length === 0 && newChatPeople.length > 0 && (
          <div className="border-t border-zinc-800 mt-4">
            <p className="text-xs text-zinc-500 px-4 pt-3 pb-2 font-semibold">NEW CHATS</p>
            <div className="divide-y divide-zinc-800">
              {newChatPeople.slice(0, 5).map((person) => {
                const profileImage = getProfileImageUrl(person.profileImage);
                return (
                  <button
                    key={person.username}
                    onClick={() => onStartNewChat(person)}
                    className="w-full p-3 hover:bg-zinc-900/50 transition text-left"
                  >
                    <div className="flex items-center gap-3">
                      {profileImage ? (
                        <img
                          src={profileImage}
                          alt={person.displayName}
                          className="w-12 h-12 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-zinc-700 flex items-center justify-center text-sm font-medium   shrink-0">
                          {person.displayName?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{person.displayName}</p>
                        <p className="text-sm text-zinc-400">@{person.username}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {isLoadingPeople && searchQuery.trim() !== "" && (
          <div className="flex items-center justify-center h-20 text-zinc-500">
            <p className="text-sm">Loading...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default SideChatsection;