import React from 'react';
import { House, UserRound, Search, Mail, Bookmark } from 'lucide-react';

const MobileBottomNav = ({ activeButton, onSelect, chatUnreadCount = 0, singleUnread = null }) => {
  const items = [
    { key: 'home', label: 'Home', icon: House },
    { key: 'profile', label: 'Profile', icon: UserRound },
    { key: 'search', label: 'Search', icon: Search },
    { key: 'chats', label: 'Chats', icon: Mail },
    { key: 'bookmarks', label: 'Bookmarks', icon: Bookmark },
  ];

  return (
    <div className="show-mobile-only fixed bottom-0 left-0 right-0 z-60 border-t border-zinc-800 bg-black/95 flex items-center" style={{ height: "70px" }}>
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeButton === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onSelect(item.key)}
              className={`flex flex-col items-center gap-1 text-sm ${isActive ? 'text-white' : 'text-zinc-300'}`}
            >
              <div className="relative">
                <Icon className="h-6 w-6" />
                {item.key === 'chats' && chatUnreadCount > 0 ? (
                  <div className="absolute -top-2 -right-3">
                    {singleUnread && chatUnreadCount === 1 ? (
                      <img src={singleUnread.profileImage || ''} alt={singleUnread.username || ''} className="h-5 w-5 rounded-full ring-1 ring-black object-cover" />
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-red-600 text-white text-xs font-medium flex items-center justify-center px-1">
                        {chatUnreadCount > 99 ? '99+' : chatUnreadCount}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
              <span className="text-xs">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MobileBottomNav;
