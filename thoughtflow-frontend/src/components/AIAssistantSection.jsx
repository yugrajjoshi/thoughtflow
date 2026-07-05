import React, { useState, useEffect, useRef } from "react";
import { Sparkles, Send, Trash2, Bot, User, Check, Copy } from "lucide-react";
import API_BASE from "../config";

const getCleanToken = () => {
    const rawToken = localStorage.getItem("token");
    return rawToken ? rawToken.replace(/^"|"$/g, "").trim() : "";
};

// Custom lightweight Markdown & Code formatter to avoid dependency install issues
function FormattedMessage({ content }) {
    const [copiedIndex, setCopiedIndex] = useState(null);

    const handleCopy = (text, index) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    if (!content) return null;

    // Split text by code blocks (```code```)
    const parts = content.split(/(```[\s\S]*?```)/g);

    return (
        <div className="space-y-2 text-[15px] leading-relaxed wrap-break-words">
            {parts.map((part, index) => {
                if (part.startsWith("```")) {
                    // Extract code content and optional language
                    const match = part.match(/```(\w*)\n([\s\S]*?)```/);
                    const language = match ? match[1] : "";
                    const code = match ? match[2].trim() : part.slice(3, -3).trim();

                    return (
                        <div key={index} className="my-3 rounded-xl border border-zinc-800/80 bg-zinc-950 overflow-hidden font-mono text-sm shadow-md">
                            <div className="flex items-center justify-between bg-zinc-900/60 px-4 py-2 text-xs text-zinc-400 border-b border-zinc-800/50">
                                <span className="uppercase tracking-wider font-semibold">{language || "code"}</span>
                                <button
                                    onClick={() => handleCopy(code, index)}
                                    className="flex items-center gap-1.5 hover:text-white transition px-2 py-1 rounded hover:bg-zinc-800"
                                >
                                    {copiedIndex === index ? (
                                        <>
                                            <Check className="w-3.5 h-3.5 text-green-400" />
                                            <span className="text-green-400">Copied</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-3.5 h-3.5" />
                                            <span>Copy</span>
                                        </>
                                    )}
                                </button>
                            </div>
                            <pre className="p-4 overflow-x-auto text-zinc-300">
                                <code>{code}</code>
                            </pre>
                        </div>
                    );
                }

                // Inline code formatting (`code`), bold text (**bold**), and list items
                let text = part;
                // Simple list items
                const lines = text.split("\n").map((line, lIdx) => {
                    let lineContent = line;

                    // Bullet lists
                    if (lineContent.startsWith("- ") || lineContent.startsWith("* ")) {
                        const innerText = lineContent.substring(2);
                        return (
                            <li key={lIdx} className="list-disc ml-5 my-1 text-zinc-300">
                                {formatInlineStyles(innerText)}
                            </li>
                        );
                    }

                    // Numbered lists
                    if (/^\d+\.\s/.test(lineContent)) {
                        const matchNum = lineContent.match(/^(\d+\.\s)(.*)/);
                        return (
                            <li key={lIdx} className="list-decimal ml-5 my-1 text-zinc-300">
                                {formatInlineStyles(matchNum[2])}
                            </li>
                        );
                    }

                    return (
                        <p key={lIdx} className="my-1 text-zinc-300">
                            {formatInlineStyles(lineContent)}
                        </p>
                    );
                });

                return <div key={index}>{lines}</div>;
            })}
        </div>
    );
}

// Format bold and inline code inside a text block
function formatInlineStyles(text) {
    if (!text) return "";
    
    // Split by inline code and bold patterns
    const tokens = text.split(/(\*\*.*?\*\*|`.*?`)/g);

    return tokens.map((token, idx) => {
        if (token.startsWith("**") && token.endsWith("**")) {
            return <strong key={idx} className="font-bold text-white">{token.slice(2, -2)}</strong>;
        }
        if (token.startsWith("`") && token.endsWith("`")) {
            return (
                <code key={idx} className="bg-zinc-800/80 px-1.5 py-0.5 rounded text-red-300 font-mono text-sm border border-zinc-700/30">
                    {token.slice(1, -1)}
                </code>
            );
        }
        return token;
    });
}

export default function AIAssistantSection() {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [userProfileImage, setUserProfileImage] = useState(null);
    const messagesEndRef = useRef(null);

    // Fetch user profile details (to get profile picture)
    useEffect(() => {
        const fetchUserProfile = async () => {
            const token = getCleanToken();
            if (!token) return;

            try {
                const res = await fetch(`${API_BASE}/api/profile/`, {
                    headers: {
                        Authorization: `Token ${token}`,
                    },
                });
                if (res.ok) {
                    const data = await res.json();
                    setUserProfileImage(data.profile_image);
                }
            } catch (err) {
                console.error("Error loading user profile:", err);
            }
        };

        fetchUserProfile();
    }, []);

    // Load Chat History
    useEffect(() => {
        const fetchHistory = async () => {
            const token = getCleanToken();
            if (!token) return;

            try {
                const res = await fetch(`${API_BASE}/api/chat/ai/history/`, {
                    headers: {
                        Authorization: `Token ${token}`,
                    },
                });
                if (res.ok) {
                    const data = await res.json();
                    setMessages(data);
                }
            } catch (err) {
                console.error("Error loading AI history:", err);
            }
        };

        fetchHistory();
    }, []);

    // Auto scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

    // Send Message
    const handleSend = async (e) => {
        if (e) e.preventDefault();
        const content = inputValue.trim();
        if (!content || isLoading) return;

        setInputValue("");
        setIsLoading(true);

        // Optimistically add user message to list
        const tempUserMessage = {
            id: Date.now(),
            role: "user",
            content: content,
            created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, tempUserMessage]);

        const token = getCleanToken();
        try {
            const res = await fetch(`${API_BASE}/api/chat/ai/send/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Token ${token}`,
                },
                body: JSON.stringify({ content }),
            });

            if (res.ok) {
                const data = await res.json();
                // Replace list with updated API responses
                setMessages((prev) => {
                    // Filter out the temporary message and append the backend saved ones
                    const filtered = prev.filter((m) => m.id !== tempUserMessage.id);
                    return [...filtered, data.user_message, data.ai_message];
                });
            } else {
                // If backend failed, append an error
                setMessages((prev) => [
                    ...prev,
                    {
                        id: Date.now() + 1,
                        role: "model",
                        content: "Sorry, I couldn't reach the server. Please try again later.",
                        created_at: new Date().toISOString(),
                    },
                ]);
            }
        } catch (err) {
            console.error("Error sending AI message:", err);
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now() + 1,
                    role: "model",
                    content: "A network error occurred. Please check your internet connection.",
                    created_at: new Date().toISOString(),
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    // Clear History
    const handleClear = async () => {
        if (!window.confirm("Are you sure you want to clear your conversation history?")) return;

        const token = getCleanToken();
        try {
            const res = await fetch(`${API_BASE}/api/chat/ai/clear/`, {
                method: "DELETE",
                headers: {
                    Authorization: `Token ${token}`,
                },
            });
            if (res.ok) {
                setMessages([]);
            }
        } catch (err) {
            console.error("Error clearing AI chat history:", err);
        }
    };

    const handleSuggestionClick = (prompt) => {
        setInputValue(prompt);
    };

    return (
        <div className="flex flex-col h-full bg-black text-white relative">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-900 bg-black/90 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-linear-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold bg-linear-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                            ThoughtFlow AI Assistant
                        </h2>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span className="text-xs text-zinc-400 font-medium">Gemini 2.5 Active</span>
                        </div>
                    </div>
                </div>

                {messages.length > 0 && (
                    <button
                        onClick={handleClear}
                        className="p-2 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-red-400 hover:border-red-500/30 transition shadow-sm flex items-center justify-center gap-1.5 text-xs font-semibold"
                        title="Clear conversation history"
                    >
                        <Trash2 className="w-4 h-4" />
                        <span className="hide-mobile">Clear Chat</span>
                    </button>
                )}
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 posts-scrollbar">
                {messages.length === 0 ? (
                    /* Welcome Empty State */
                    <div className="flex flex-col items-center justify-center h-full max-w-lg mx-auto text-center space-y-6 py-12">
                        <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 shadow-inner flex items-center justify-center animate-bounce duration-1000">
                            <Bot className="w-10 h-10 text-blue-400" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-white">How can I help you today?</h3>
                            <p className="text-sm text-zinc-400 px-4">
                                I'm powered by Gemini and fully integrated into your workspace. Ask me to explain concepts, draft content, or help you brainstorm.
                            </p>
                        </div>

                        {/* Suggestion Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full pt-4">
                            {[
                                "Explain recursion in programming simply",
                                "Write a poem about a creative mindset",
                                "Help me write a professional social post",
                                "Give me brainstorming ideas for a side-project"
                            ].map((prompt, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSuggestionClick(prompt)}
                                    className="p-4 rounded-xl border border-zinc-900 bg-zinc-950 text-left text-sm text-zinc-300 hover:bg-zinc-900/60 hover:border-zinc-800 transition shadow hover:shadow-md cursor-pointer"
                                >
                                    {prompt}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isAI = msg.role === "model";
                        return (
                            <div
                                key={msg.id}
                                className={`flex gap-3 max-w-[85%] ${isAI ? "self-start" : "ml-auto flex-row-reverse"}`}
                            >
                                {/* Avatar */}
                                <div className="shrink-0">
                                    {isAI ? (
                                        <div className="w-8 h-8 rounded-full bg-linear-to-br from-blue-600 to-indigo-600 flex items-center justify-center border border-blue-400/20 shadow">
                                            <Bot className="w-4 h-4 text-white" />
                                        </div>
                                    ) : userProfileImage ? (
                                        <img
                                            src={userProfileImage}
                                            alt="User Profile"
                                            className="w-8 h-8 rounded-full object-cover border border-zinc-800"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-zinc-850 flex items-center justify-center border border-zinc-700/50">
                                            <User className="w-4 h-4 text-zinc-400" />
                                        </div>
                                    )}
                                </div>

                                {/* Bubble */}
                                <div
                                    className={`rounded-2xl px-4 py-3 shadow-md border ${
                                        isAI
                                            ? "bg-zinc-950 border-zinc-900 text-zinc-100"
                                            : "bg-zinc-850/50 border-zinc-800/80 text-zinc-100"
                                    }`}
                                >
                                    <FormattedMessage content={msg.content} />
                                </div>
                            </div>
                        );
                    })
                )}

                {/* Loading State */}
                {isLoading && (
                    <div className="flex gap-3 max-w-[80%] self-start">
                        <div className="w-8 h-8 rounded-full bg-linear-to-br from-blue-600 to-indigo-600 flex items-center justify-center border border-blue-400/20 shadow">
                            <Bot className="w-4 h-4 text-white" />
                        </div>
                        <div className="rounded-2xl px-5 py-4 bg-zinc-950 border border-zinc-900 text-zinc-400 flex items-center justify-center shadow-md">
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce delay-100"></span>
                                <span className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce delay-250"></span>
                                <span className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce delay-400"></span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form
                onSubmit={handleSend}
                className="px-6 py-4 border-t border-zinc-900 bg-black/95 backdrop-blur-md sticky bottom-0 z-10"
            >
                <div className="relative flex items-center">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={isLoading ? "AI is thinking..." : "Ask your AI assistant..."}
                        disabled={isLoading}
                        className="w-full bg-zinc-950/80 border border-zinc-800/80 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 text-white rounded-2xl py-3.5 pl-4 pr-14 outline-none transition text-sm shadow-inner placeholder:text-zinc-500 disabled:opacity-50"
                    />
                    <button
                        type="submit"
                        disabled={!inputValue.trim() || isLoading}
                        className="absolute right-2 p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800/80 text-white disabled:text-zinc-500 transition shadow flex items-center justify-center cursor-pointer"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </form>
        </div>
    );
}
