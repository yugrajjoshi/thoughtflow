import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Reply, Trash2, Trash, Paperclip, X } from "lucide-react";


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

function MassangerSection({ selectedUser, selectedConversationId, onConversationChanged }) {
    const profileImage = getUserImage(selectedUser);
    const displayName = selectedUser?.displayName || selectedUser?.name || selectedUser?.username || "";
    const username = selectedUser?.username || "";
    const [draft, setDraft] = useState("");
    const [messages, setMessages] = useState([]);
    const [replyToMessage, setReplyToMessage] = useState(null);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);
    const [attachmentFile, setAttachmentFile] = useState(null);
    const [attachmentPreviewUrl, setAttachmentPreviewUrl] = useState("");
    const [attachmentType, setAttachmentType] = useState("");
    const [notice, setNotice] = useState({ type: "", message: "" });
    const [confirmDialog, setConfirmDialog] = useState({ open: false, title: "", message: "", action: null });
    const fileInputRef = useRef(null);

    const showNotice = useCallback((type, message) => {
        setNotice({ type, message });
        window.setTimeout(() => {
            setNotice((current) => (current.message === message ? { type: "", message: "" } : current));
        }, 2400);
    }, []);

    const clearAttachment = useCallback(() => {
        if (attachmentPreviewUrl) {
            URL.revokeObjectURL(attachmentPreviewUrl);
        }
        setAttachmentFile(null);
        setAttachmentPreviewUrl("");
        setAttachmentType("");
    }, [attachmentPreviewUrl]);

    const fetchMessages = useCallback(async ({ showLoader = true } = {}) => {
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
        } catch (error) {
            console.error("Failed to fetch messages:", error);
            setMessages([]);
        } finally {
            setIsLoadingMessages(false);
        }
    }, [selectedConversationId]);

    useEffect(() => {
        setReplyToMessage(null);
        clearAttachment();
        fetchMessages();
    }, [selectedConversationId, clearAttachment, fetchMessages]);

    useEffect(() => {
        return () => {
            if (attachmentPreviewUrl) {
                URL.revokeObjectURL(attachmentPreviewUrl);
            }
        };
    }, [attachmentPreviewUrl]);

    useEffect(() => {
        if (!selectedConversationId) {
            return;
        }

        const pollId = setInterval(() => {
            fetchMessages({ showLoader: false });
        }, 2000);

        return () => clearInterval(pollId);
    }, [selectedConversationId, fetchMessages]);

    const handleSendMessage = async () => {
        const content = draft.trim();
        if ((!content && !attachmentFile) || !selectedConversationId || sending) {
            return;
        }

        const token = getCleanToken();
        if (!token) {
            return;
        }

        try {
            setSending(true);
            const payload = new FormData();
            payload.append("content", content);
            if (replyToMessage?.id) {
                payload.append("reply_to_id", String(replyToMessage.id));
            }
            if (attachmentFile && attachmentType === "image") {
                payload.append("image", attachmentFile);
            }
            if (attachmentFile && attachmentType === "video") {
                payload.append("video", attachmentFile);
            }

            const response = await fetch(`${API_BASE}/api/chat/conversations/${selectedConversationId}/messages/`, {
                method: "POST",
                headers: {
                    Authorization: "Token " + token,
                },
                body: payload,
            });

            if (!response.ok) {
                throw new Error(`Failed to send message: ${response.status}`);
            }

            const createdMessage = await response.json();
            setMessages((currentMessages) => [...currentMessages, createdMessage]);
            setDraft("");
            setReplyToMessage(null);
            clearAttachment();

            if (typeof onConversationChanged === "function") {
                onConversationChanged();
            }
        } catch (error) {
            console.error("Failed to send message:", error);
        } finally {
            setSending(false);
        }
    };

    const handleFilePick = (event) => {
        const selectedFile = event.target.files?.[0] || null;
        if (!selectedFile) {
            return;
        }

        if (!selectedFile.type.startsWith("image/") && !selectedFile.type.startsWith("video/")) {
            showNotice("error", "Only image and video files are supported in chat messages.");
            event.target.value = "";
            return;
        }

        clearAttachment();

        const objectUrl = URL.createObjectURL(selectedFile);
        setAttachmentFile(selectedFile);
        setAttachmentPreviewUrl(objectUrl);
        setAttachmentType(selectedFile.type.startsWith("image/") ? "image" : "video");
        event.target.value = "";
    };

    const deleteForMe = async (messageId) => {
        if (!messageId) {
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
            showNotice("error", "Failed to delete message for you.");
        }
    };

    const deleteForEveryone = async (messageId) => {
        if (!messageId) {
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
            showNotice("error", "Failed to delete message for everyone.");
        }
    };

    const askDeleteForMe = (messageId) => {
        setConfirmDialog({
            open: true,
            title: "Delete Message",
            message: "Delete this message for you?",
            action: () => deleteForMe(messageId),
        });
    };

    const askDeleteForEveryone = (messageId) => {
        setConfirmDialog({
            open: true,
            title: "Delete For Everyone",
            message: "Delete this message for everyone? This cannot be undone.",
            action: () => deleteForEveryone(messageId),
        });
    };

    const handleConfirmDialogAction = async () => {
        const action = confirmDialog.action;
        setConfirmDialog({ open: false, title: "", message: "", action: null });
        if (typeof action === "function") {
            await action();
        }
    };

    const seenCount = useMemo(() => {
        return messages.filter((message) => message.is_mine && Boolean(message.read_at)).length;
    }, [messages]);

    return (
        <main className="w-full p-2 h-full flex flex-col">
            {notice.message ? (
                <div className={`mb-2 px-3 py-2 rounded-lg text-sm border ${notice.type === "error" ? "border-red-500/40 bg-red-900/30 text-red-200" : "border-green-500/40 bg-green-900/30 text-green-200"}`}>
                    {notice.message}
                </div>
            ) : null}
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
                            <Link to={`/profile/${username}`} className="inline-flex max-w-fit text-white font-semibold truncate hover:underline">
                                {displayName}
                            </Link>
                            <Link to={`/profile/${username}`} className="mt-0.5 inline-flex max-w-fit text-sm text-zinc-400 truncate hover:underline">
                                @{username}
                            </Link>
                        </div>
                    </div>
                ) : (
                    <p className="text-zinc-500 text-sm">Search and select a user to start chatting.</p>
                )}
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
                                                Replying to <Link to={`/profile/${message.reply_to.sender_username}`} className="underline">@{message.reply_to.sender_username}</Link>: {message.reply_to.content}
                                            </div>
                                        ) : null}

                                        <div>{message.content}</div>

                                        {message.image_url ? (
                                            <img src={message.image_url} alt="Chat attachment" className="rounded-xl mt-1 max-h-72 w-full object-cover" />
                                        ) : null}

                                        {message.video_url ? (
                                            <video controls className="rounded-xl mt-1 max-h-72 w-full">
                                                <source src={message.video_url} />
                                            </video>
                                        ) : null}

                                        {message.shared_post ? (
                                            <div className="mt-2 rounded-xl border border-white/20 bg-black/25 p-2">
                                                <p className="text-[11px] uppercase tracking-[0.08em] opacity-70">Shared Post</p>
                                                <Link to={`/profile/${message.shared_post.username}`} className="text-xs opacity-80 mt-1 block underline">@{message.shared_post.username}</Link>
                                                <p className="text-sm mt-1 whitespace-pre-wrap">{message.shared_post.content}</p>
                                                {message.shared_post.image ? (
                                                    <img src={message.shared_post.image} alt="Shared post" className="rounded-lg mt-2 max-h-60 w-full object-cover" />
                                                ) : null}
                                                {message.shared_post.video ? (
                                                    <video controls className="rounded-lg mt-2 max-h-60 w-full">
                                                        <source src={message.shared_post.video} />
                                                    </video>
                                                ) : null}
                                            </div>
                                        ) : null}

                                        <div className="text-[11px] opacity-70 flex items-center justify-between gap-4">
                                            <span>{new Date(message.created_at).toLocaleTimeString()}</span>
                                            <div className="flex items-center gap-2">
                                                {canReply ? (
                                                    <button type="button" onClick={() => setReplyToMessage(message)} className="hover:text-white">
                                                        <Reply size={13} />
                                                    </button>
                                                ) : null}
                                                <button type="button" onClick={() => askDeleteForMe(message.id)} className="hover:text-white" title="Delete for me">
                                                    <Trash2 size={13} />
                                                </button>
                                                {message.can_delete_for_everyone ? (
                                                    <button type="button" onClick={() => askDeleteForEveryone(message.id)} className="hover:text-white" title="Delete for everyone">
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
                            Conversation with <Link to={`/profile/${username}`} className="underline mx-1">@{username}</Link> is selected. Send a message to start chatting.
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
                        Replying to <Link to={`/profile/${replyToMessage.sender_username}`} className="underline">@{replyToMessage.sender_username}</Link>: {replyToMessage.content || "(media/post)"}
                        <button type="button" onClick={() => setReplyToMessage(null)} className="ml-2 text-zinc-400 hover:text-white">x</button>
                    </div>
                ) : null}
                {attachmentFile ? (
                    <div className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-zinc-300 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                            <p className="truncate">Attachment: {attachmentFile.name}</p>
                            <p className="text-zinc-500">Type: {attachmentType}</p>
                        </div>
                        <button type="button" onClick={clearAttachment} className="text-zinc-400 hover:text-white">
                            <X size={14} />
                        </button>
                    </div>
                ) : null}
                {attachmentPreviewUrl && attachmentType === "image" ? (
                    <img src={attachmentPreviewUrl} alt="Attachment preview" className="rounded-lg max-h-44 w-full object-cover" />
                ) : null}
                {attachmentPreviewUrl && attachmentType === "video" ? (
                    <video controls className="rounded-lg max-h-44 w-full">
                        <source src={attachmentPreviewUrl} />
                    </video>
                ) : null}
                <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!selectedUser || sending}
                    className="p-2 rounded-full border border-zinc-800 text-zinc-300 hover:text-white disabled:opacity-60"
                    title="Attach image or video"
                >
                    <Paperclip size={16} />
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFilePick}
                    className="hidden"
                />
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
                    disabled={!selectedUser || (!draft.trim() && !attachmentFile) || sending}
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

            {confirmDialog.open ? (
                <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
                    <div className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-950 p-5">
                        <h3 className="text-lg font-semibold text-white">{confirmDialog.title}</h3>
                        <p className="mt-2 text-sm text-zinc-400">{confirmDialog.message}</p>
                        <div className="mt-5 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setConfirmDialog({ open: false, title: "", message: "", action: null })}
                                className="px-4 py-2 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-900"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmDialogAction}
                                className="px-4 py-2 rounded-lg bg-white text-black font-semibold"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

        </main>
    );
}

export default MassangerSection;