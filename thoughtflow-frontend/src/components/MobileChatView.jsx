import React from 'react';
import SideChatsection from './sidechatsection';

const MobileChatView = ({
  selectedChatUser,
  filteredChatConversations,
  filteredNewChatPeople,
  chatSearchQuery,
  onSearchChange,
  onSelectUser,
  onDeleteConversation,
  onToggleMuteConversation,
}) => {
  return (
    <section className="show-mobile-only w-full bg-black text-white">
      <div className="h-full w-full">
        <SideChatsection
          conversations={filteredChatConversations}
          searchQuery={chatSearchQuery}
          onSearchChange={onSearchChange}
          onSelectUser={onSelectUser}
          selectedUsername={selectedChatUser?.username || ""}
          newChatPeople={filteredNewChatPeople}
          onStartNewChat={onSelectUser}
          isLoadingPeople={false}
          onDeleteConversation={onDeleteConversation}
          onToggleMuteConversation={onToggleMuteConversation}
        />
      </div>
    </section>
  );
};

export default MobileChatView;
