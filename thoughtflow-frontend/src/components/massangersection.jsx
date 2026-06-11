import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import SharedPostPreview from "./SharedPostPreview";
import { Reply, Trash2, Trash, Paperclip, X } from "lucide-react";
import API_BASE from '../config';

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

const closeSocketSafely = (socket) => {
    if (!socket) {
        return;
    }

    if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CLOSING) {
        try {
            socket.close();
        } catch {
            // ignore
        }
        return;
    }

    if (socket.readyState === WebSocket.CONNECTING) {
        socket.onopen = () => {
            try {
                socket.close();
            } catch {
                // ignore
            }
        };
    }
};

const dedupeMessagesById = (messagesList) => {
    const seenIds = new Set();
    return messagesList.filter((message) => {
        const messageId = message?.id;
        if (messageId == null) {
            return true;
        }

        if (seenIds.has(messageId)) {
            return false;
        }

        seenIds.add(messageId);
        return true;
    });
};

function MassangerSection({ selectedUser, selectedConversationId, onConversationChanged, onOpenPost, compactHeader = false }) {
    const profileImage = getUserImage(selectedUser);
    const displayName = selectedUser?.displayName || selectedUser?.name || selectedUser?.username || "";
    const username = selectedUser?.username || "";
    const isConversationOpen = Boolean(selectedConversationId);
    const [draft, setDraft] = useState("");
    const [messages, setMessages] = useState([]);
    const [replyToMessage, setReplyToMessage] = useState(null);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const wsRef = useRef(null);
    const [sending, setSending] = useState(false);
    const [attachmentFile, setAttachmentFile] = useState(null);
    const [attachmentPreviewUrl, setAttachmentPreviewUrl] = useState("");
    const [attachmentType, setAttachmentType] = useState("");
    const [_notice, setNotice] = useState({ type: "", message: "" });
    const [confirmDialog, setConfirmDialog] = useState({ open: false, title: "", message: "", action: null });
    const fileInputRef = useRef(null);

    const formatTimeHoursMinutes = useCallback((dateTimeValue) => {
        if (!dateTimeValue) {
            return "";
        }

        const value = new Date(dateTimeValue);
        if (Number.isNaN(value.getTime())) {
            return "";
        }

        return value.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        });
    }, []);

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

    // Open a websocket for this conversation to receive real-time messages
    useEffect(() => {
        const token = getCleanToken();
        if (!selectedConversationId || !token) {
            if (wsRef.current) {
                closeSocketSafely(wsRef.current);
                wsRef.current = null;
            }
            return;
        }

        const wsUrl = `${API_BASE.replace(/^http/, 'ws')}/ws/conversations/${selectedConversationId}/?token=${token}`;
        try {
            const socket = new WebSocket(wsUrl);
            wsRef.current = socket;

            socket.onopen = () => {
                // console.log('Conversation websocket opened', selectedConversationId);
            };

            socket.onmessage = (ev) => {
                try {
                    const data = JSON.parse(ev.data || '{}');
                    if (data?.type === 'new_message' && data.payload) {
                        const newMsg = data.payload;
                        setMessages((current) => {
                            // avoid duplicate if message already present
                            if (current.some((m) => m.id === newMsg.id)) return current;
                            return dedupeMessagesById([...current, newMsg]);
                        });
                        if (typeof onConversationChanged === 'function') {
                            onConversationChanged();
                        }
                    }
                } catch {
                    // ignore parse errors
                }
            };

            socket.onclose = () => {
                wsRef.current = null;
            };
        } catch (err) {
            console.error('Failed to open conversation websocket', err);
            wsRef.current = null;
        }

        return () => {
            if (wsRef.current) {
                closeSocketSafely(wsRef.current);
                wsRef.current = null;
            }
        };
    }, [selectedConversationId, onConversationChanged]);

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
        if ((!content && !attachmentFile) || !selectedConversationId || !selectedUser || sending) {
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
            setMessages((currentMessages) => dedupeMessagesById([...currentMessages, createdMessage]));
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

    const canSend = Boolean(selectedUser && selectedConversationId && (draft.trim() || attachmentFile));

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

    const lastOwnMessageId = useMemo(() => {
        for (let index = messages.length - 1; index >= 0; index -= 1) {
            if (messages[index]?.is_mine) {
                return messages[index].id;
            }
        }

        return null;
    }, [messages]);

    const getImageValue = (message) => {
        return message?.image_url || message?.image || "";
    };

    const getVideoValue = (message) => {
        return message?.video_url || message?.video || "";
    };

    return (
        <main className={`w-full h-full flex flex-col min-h-0 ${compactHeader ? "p-0" : "p-2"}`}>
            {!compactHeader ? (
                <div className="border border-zinc-800 w-full min-h-20 px-4 py-3 flex items-center justify-between">
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
                            {isConversationOpen ? (
                                <>
                                    <Link to={`/profile/${username}`} className="inline-flex max-w-fit text-white font-semibold truncate hover:underline">
                                        {displayName}
                                    </Link>
                                    <Link to={`/profile/${username}`} className="ml-2 inline-flex text-sm text-zinc-400 truncate hover:underline">
                                        @{username}
                                    </Link>
                                </>
                            ) : (
                                <div className="text-white font-semibold truncate">{displayName}</div>
                            )}
                        </div>
                    </div>
                </div>
            ) : null}

            <section className={`flex-1 min-h-0 overflow-y-auto posts-scrollbar ${compactHeader ? "bg-zinc-950/40 px-3 pb-3" : "border-l border-r border-b border-zinc-800 bg-zinc-950/60 p-4"}`}>
                {selectedUser ? (
                    isLoadingMessages ? (
                        <div className="h-full w-full flex items-center justify-center text-zinc-500 text-sm">
                            Loading messages...
                        </div>
                    ) : messages.length > 0 ? (
                        <div className="flex flex-col gap-2.5">
                            {messages.map((message) => {
                                const canReply = !message.deleted_for_everyone;
                                const isOwnLatestMessage = message.is_mine && message.id === lastOwnMessageId;
                                return (
                                    <div
                                        key={message.id}
                                        className={`max-w-[82%] rounded-3xl border px-4 py-3 text-sm shadow-lg shadow-black/20 transition ${message.is_mine ? "self-end border-emerald-400/20 bg-emerald-500/20 text-white backdrop-blur" : "self-start border-zinc-700/70 bg-zinc-900/95 text-zinc-100"}`}
                                    >
                                        {message.reply_to ? (
                                            <div className="mb-2 border-l-2 border-white/20 pl-2 text-xs text-zinc-300/90">
                                                Replying to <Link to={`/profile/${message.reply_to.sender_username}`} className="underline">@{message.reply_to.sender_username}</Link>: {message.reply_to.content}
                                            </div>
                                        ) : null}

                                        <div className="leading-6 whitespace-pre-wrap wrap-break-word">{message.content}</div>

                                        {getImageValue(message) ? (
                                            <img src={getImageValue(message)} alt="Chat attachment" className="mt-2 max-h-72 w-full rounded-2xl object-cover" />
                                        ) : null}

                                        {getVideoValue(message) ? (
                                            <video controls className="mt-2 max-h-72 w-full rounded-2xl">
                                                <source src={getVideoValue(message)} />
                                            </video>
                                        ) : null}

                                        {message.shared_post ? (
                                            <SharedPostPreview post={message.shared_post} onOpenPost={onOpenPost} />
                                        ) : null}

                                        <div className="mt-1.5 flex items-center justify-between gap-1.5 text-[10px] text-zinc-300/70">
                                            <span className="shrink-0 tracking-wide">
                                                {formatTimeHoursMinutes(message.created_at)}
                                            </span>
                                            <div className="flex items-center gap-1">
                                                {canReply ? (
                                                    <button type="button" onClick={() => setReplyToMessage(message)} className="inline-flex h-5 w-5 items-center justify-center rounded-full p-0.5 hover:bg-white/10 hover:text-white" aria-label="Reply message">
                                                        <Reply size={13} />
                                                    </button>
                                                ) : null}
                                                <button type="button" onClick={() => askDeleteForMe(message.id)} className="inline-flex h-5 w-5 items-center justify-center rounded-full p-0.5 hover:bg-white/10 hover:text-white" title="Delete for me" aria-label="Delete for me">
                                                    <Trash2 size={13} />
                                                </button>
                                                {message.can_delete_for_everyone ? (
                                                    <button type="button" onClick={() => askDeleteForEveryone(message.id)} className="inline-flex h-5 w-5 items-center justify-center rounded-full p-0.5 hover:bg-white/10 hover:text-white" title="Delete for everyone" aria-label="Delete for everyone">
                                                        <Trash size={13} />
                                                    </button>
                                                ) : null}
                                            </div>
                                        </div>

                                        {isOwnLatestMessage ? (
                                            <div className="mt-1 text-right text-[11px] text-zinc-300/85">
                                                {message.read_at ? "Seen" : "Sent"}
                                            </div>
                                        ) : null}
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

            <div className={`bg-zinc-950/90 px-3 py-2.5 backdrop-blur-sm flex flex-col gap-2 ${compactHeader ? "border-t border-zinc-800" : "border-l border-r border-b border-zinc-800"}`}>
                {replyToMessage ? (
                    <div className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-700/80 bg-zinc-900/80 px-3 py-2 text-xs text-zinc-300">
                        <div className="min-w-0 truncate">
                        Replying to <Link to={`/profile/${replyToMessage.sender_username}`} className="underline">@{replyToMessage.sender_username}</Link>: {replyToMessage.content || "(media/post)"}
                        </div>
                        <button type="button" onClick={() => setReplyToMessage(null)} className="rounded-full px-2 py-1 text-zinc-400 hover:bg-white/10 hover:text-white">x</button>
                    </div>
                ) : null}
                {attachmentFile ? (
                    <div className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-700/80 bg-zinc-900/80 px-3 py-2 text-xs text-zinc-300">
                        <div className="min-w-0">
                            <p className="truncate">Attachment: {attachmentFile.name}</p>
                            <p className="text-zinc-500">Type: {attachmentType}</p>
                        </div>
                        <button type="button" onClick={clearAttachment} className="rounded-full px-2 py-1 text-zinc-400 hover:bg-white/10 hover:text-white">
                            <X size={14} />
                        </button>
                    </div>
                ) : null}
                {attachmentPreviewUrl && attachmentType === "image" ? (
                    <img src={attachmentPreviewUrl} alt="Attachment preview" className="max-h-44 w-full rounded-2xl object-cover" />
                ) : null}
                {attachmentPreviewUrl && attachmentType === "video" ? (
                    <video controls className="max-h-44 w-full rounded-2xl">
                        <source src={attachmentPreviewUrl} />
                    </video>
                ) : null}
                <div className="flex items-center gap-2.5 rounded-3xl bg-black/70 px-2.5 py-2 shadow-inner shadow-black/20">
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!selectedUser || sending}
                    className="rounded-full border border-zinc-700/80 p-2 text-zinc-300 transition hover:border-zinc-500 hover:bg-white/5 hover:text-white disabled:opacity-60"
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
                    className="flex-1 rounded-full border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-400/40 focus:outline-none disabled:opacity-60"
                />
                <button
                    type="button"
                    onClick={handleSendMessage}
                    disabled={!canSend || sending}
                    className="rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-50"
                >
                    {sending ? "Sending..." : "Send"}
                </button>
                </div>
            </div>

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