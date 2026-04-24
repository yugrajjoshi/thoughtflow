import React, { useEffect, useMemo, useState } from "react";
import { MessageSquareText, Phone, MoreHorizontal, Reply, Trash2, Trash } from "lucide-react";


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

function MassangerSection({ selectedUser, selectedConversationId, currentUserId, onConversationChanged }) {
    const profileImage = getUserImage(selectedUser);
    const displayName = selectedUser?.displayName || selectedUser?.name || selectedUser?.username || "";
    const username = selectedUser?.username || "";
    const [draft, setDraft] = useState("");
    const [messages, setMessages] = useState([]);
    const [replyToMessage, setReplyToMessage] = useState(null);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);

    const fetchMessages = async ({ showLoader = true } = {}) => {
        if (!selectedConversationId) {
            setMessages([]);
            return;
        }

        const token = getCleanToken();
        if (!token) {
            return;
        }

        if (showLoader) {
            setIsLoadingMessages(true);
        }

        try {
            const response = await fetch(`${API_BASE}/api/chat/conversations/${selectedConversationId}/messages/`, {
                headers: {
                    Authorization: "Token " + token,
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to load messages: ${response.status}`);
            }

            const data = await response.json();
            setMessages(Array.isArray(data) ? data : []);

            if (typeof onConversationChanged === "function") {
                onConversationChanged();
            }
        } catch (error) {
            console.error("Failed to fetch messages:", error);
            setMessages([]);
        } finally {
            setIsLoadingMessages(false);
        }
    };

    useEffect(() => {
        setReplyToMessage(null);
        fetchMessages();
    }, [selectedConversationId]);

    useEffect(() => {
        if (!selectedConversationId) {
            return;
        }

        const pollId = setInterval(() => {
            fetchMessages({ showLoader: false });
        }, 2000);

        return () => clearInterval(pollId);
    }, [selectedConversationId]);

    const handleSendMessage = async () => {
        const content = draft.trim();
        if (!content || !selectedConversationId || sending) {
            return;
        }

        const token = getCleanToken();
        if (!token) {
            return;
        }

        try {
            setSending(true);
            const response = await fetch(`${API_BASE}/api/chat/conversations/${selectedConversationId}/messages/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Token " + token,
                },
                body: JSON.stringify({
                    content,
                    reply_to_id: replyToMessage?.id || null,
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to send message: ${response.status}`);
            }

            const createdMessage = await response.json();
            setMessages((currentMessages) => [...currentMessages, createdMessage]);
            setDraft("");
            setReplyToMessage(null);

            if (typeof onConversationChanged === "function") {
                onConversationChanged();
            }
        } catch (error) {
            console.error("Failed to send message:", error);
        } finally {
            setSending(false);
        }
    };

    const handleDeleteForMe = async (messageId) => {
        if (!messageId) {
            return;
        }

        const confirmed = window.confirm("Delete this message for you?");
        if (!confirmed) {
            return;
        }

        const token = getCleanToken();
        if (!token) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/api/chat/messages/${messageId}/delete-for-me/`, {
                method: "POST",
                headers: {
                    Authorization: "Token " + token,
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to delete message for me: ${response.status}`);
            }

            setMessages((currentMessages) => currentMessages.filter((message) => message.id !== messageId));

            if (typeof onConversationChanged === "function") {
                onConversationChanged();
            }
        } catch (error) {
            console.error("Failed to delete message for me:", error);
        }
    };

    const handleDeleteForEveryone = async (messageId) => {
        if (!messageId) {
            return;
        }

        const confirmed = window.confirm("Delete this message for everyone? This cannot be undone.");
        if (!confirmed) {
            return;
        }

        const token = getCleanToken();
        if (!token) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/api/chat/messages/${messageId}/delete-for-everyone/`, {
                method: "POST",
                headers: {
                    Authorization: "Token " + token,
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to delete message for everyone: ${response.status}`);
            }

            setMessages((currentMessages) => currentMessages.map((message) => (
                message.id === messageId
                    ? {
                        ...message,
                        content: "This message was deleted",
                        deleted_for_everyone: true,
                        can_delete_for_everyone: false,
                    }
                    : message
            )));

            if (typeof onConversationChanged === "function") {
                onConversationChanged();
            }
        } catch (error) {
            console.error("Failed to delete message for everyone:", error);
        }
    };

    const seenCount = useMemo(() => {
        return messages.filter((message) => message.is_mine && Boolean(message.read_at)).length;
    }, [messages]);

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

            <section className="flex-1 border-l border-r border-b border-zinc-800 bg-zinc-950/60 p-4 overflow-y-auto posts-scrollbar">
                {selectedUser ? (
                    isLoadingMessages ? (
                        <div className="h-full w-full flex items-center justify-center text-zinc-500 text-sm">
                            Loading messages...
                        </div>
                    ) : messages.length > 0 ? (
                        <div className="flex flex-col gap-3">
                            {messages.map((message) => {
                                const canReply = !message.deleted_for_everyone;
                                return (
                                    <div
                                        key={message.id}
                                        className={`max-w-[82%] px-4 py-2 rounded-2xl text-sm flex flex-col gap-1 ${message.is_mine ? "self-end bg-green-700/70 text-white" : "self-start bg-zinc-800 text-zinc-200"}`}
                                    >
                                        {message.reply_to ? (
                                            <div className="text-xs opacity-80 border-l-2 border-white/50 pl-2">
                                                Replying to @{message.reply_to.sender_username}: {message.reply_to.content}
                                            </div>
                                        ) : null}

                                        <div>{message.content}</div>

                                        <div className="text-[11px] opacity-70 flex items-center justify-between gap-4">
                                            <span>{new Date(message.created_at).toLocaleTimeString()}</span>
                                            <div className="flex items-center gap-2">
                                                {canReply ? (
                                                    <button type="button" onClick={() => setReplyToMessage(message)} className="hover:text-white">
                                                        <Reply size={13} />
                                                    </button>
                                                ) : null}
                                                <button type="button" onClick={() => handleDeleteForMe(message.id)} className="hover:text-white" title="Delete for me">
                                                    <Trash2 size={13} />
                                                </button>
                                                {message.can_delete_for_everyone ? (
                                                    <button type="button" onClick={() => handleDeleteForEveryone(message.id)} className="hover:text-white" title="Delete for everyone">
                                                        <Trash size={13} />
                                                    </button>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="h-full w-full flex items-center justify-center text-zinc-500 text-sm">
                            Conversation with @{username} is selected. Send a message to start chatting.
                        </div>
                    )
                ) : (
                    <div className="h-full w-full flex items-center justify-center text-zinc-500 text-sm">
                        Select a user from the Chats list to open conversation.
                    </div>
                )}
            </section>

            <div className="border-l border-r border-b border-zinc-800 p-3 flex flex-col gap-2">
                {replyToMessage ? (
                    <div className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-zinc-300">
                        Replying to @{replyToMessage.sender_username}: {replyToMessage.content}
                        <button type="button" onClick={() => setReplyToMessage(null)} className="ml-2 text-zinc-400 hover:text-white">x</button>
                    </div>
                ) : null}
                <div className="flex items-center gap-3">
                <input
                    type="text"
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === "Enter") {
                            event.preventDefault();
                            handleSendMessage();
                        }
                    }}
                    disabled={!selectedUser}
                    placeholder={selectedUser ? "Type a message" : "Select a user to chat"}
                    className="flex-1 rounded-full bg-black border border-zinc-800 px-4 py-2 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none disabled:opacity-60"
                />
                <button
                    type="button"
                    onClick={handleSendMessage}
                    disabled={!selectedUser || !draft.trim() || sending}
                    className="px-4 py-2 rounded-full bg-white text-black text-sm font-semibold disabled:opacity-50"
                >
                    {sending ? "Sending..." : "Send"}
                </button>
                </div>
            </div>

            {selectedUser ? (
                <div className="text-xs text-zinc-500 mt-2 px-2 text-right">
                    Seen messages: {seenCount}
                </div>
            ) : null}

        </main>
    );
}

export default MassangerSection;