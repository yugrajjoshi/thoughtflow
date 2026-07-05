import { House, UserRound, Search, Mail, LogOut, Bookmark, Settings, Bell, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Logo from "./Logo";

function SidebarNav({ activeButton, onSelect, onLogout, chatUnreadCount = 0, chatSingleUnread = null, notificationUnreadCount = 0 }) {
    const navigate = useNavigate();
    
    return (
        <nav className="responsive-sidebar fixed top-0 left-0 h-screen w-[20%] bg-black overflow-hidden flex flex-col">
            <header className="flex text-white  -ml-50 top-0 self-center w-[35%]">
                <Logo
                    alt="Logo Image"
                    className="ml-1 mt-1 w-full h-full object-cover rounded-lg"
                />
            </header>

            <section className="flex flex-col gap-2 mt-5 flex-1">
                <button
                    className={`text-white gap-6 text-2xl font-bold p-3 transition duration-300 ml-6 w-[70%] ${activeButton === "home" ? "bg-zinc-800/30" : "hover:bg-zinc-800/30"} rounded-4xl flex items-center`}
                    onClick={() => onSelect("home")}
                    title="Home"
                >
                    <House className="w-9 h-9" />
                    <span className="hide-mobile">Home</span>
                </button>

                <button
                    className={`text-white gap-6 text-2xl font-bold p-3 transition duration-300 ml-6 w-[70%] ${activeButton === "profile" ? "bg-zinc-800/30" : "hover:bg-zinc-800/30"} rounded-4xl flex items-center`}
                    onClick={() => onSelect("profile")}
                    title="Profile"
                >
                    <UserRound className="w-9 h-9" />
                    <span className="hide-mobile">Profile</span>
                </button>

                <button
                    className={`text-white gap-6 text-2xl font-bold p-3 transition duration-300 ml-6 w-[70%] show-mobile-only ${activeButton === "search" ? "bg-zinc-800/30" : "hover:bg-zinc-800/30"} rounded-4xl flex items-center`}
                    onClick={() => onSelect("search")}
                    title="Search"
                >
                    <Search className="w-9 h-9" />
                    <span className="hide-mobile">Search</span>
                </button>

                <button
                    className={`text-white gap-6 text-2xl font-bold p-3 transition duration-300 ml-6 w-[70%] ${activeButton === "chats" ? "bg-zinc-800/30" : "hover:bg-zinc-800/30"} rounded-4xl flex items-center relative`}
                    onClick={() => onSelect("chats")}
                    title="Chats"
                >
                    <div className="relative">
                        <Mail className="w-9 h-9" />
                        {chatUnreadCount > 0 ? (
                            <div className="absolute -top-1 -right-2 flex items-center justify-center">
                                {chatSingleUnread && chatUnreadCount === 1 ? (
                                    <img src={chatSingleUnread.profileImage || ""} alt={chatSingleUnread.username || ""} className="h-6 w-6 rounded-full ring-1 ring-black object-cover" />
                                ) : (
                                    <div className="w-5 h-5 rounded-full bg-red-600 text-white text-xs font-medium flex items-center justify-center px-1">
                                        {chatUnreadCount > 99 ? '99+' : chatUnreadCount}
                                    </div>
                                )}
                            </div>
                        ) : null}
                    </div>
                    <span className="hide-mobile">Chats</span>
                </button>

                <button
                    className={`text-white gap-6 text-2xl font-bold p-3 transition duration-300 ml-6 w-[70%] ${activeButton === "ai-chat" ? "bg-zinc-800/30" : "hover:bg-zinc-800/30"} rounded-4xl flex items-center`}
                    onClick={() => onSelect("ai-chat")}
                    title="AI Assistant"
                >
                    <Sparkles className="w-9 h-9 text-blue-400" />
                    <span className="hide-mobile">AI Assistant</span>
                </button>

                <button
                    onClick={() => onSelect("bookmarks")}
                    className={`text-white gap-6 text-2xl font-bold p-3 transition duration-300 ml-6 w-[70%] ${activeButton === "bookmarks" ? "bg-zinc-800/30" : "hover:bg-zinc-800/30"} rounded-4xl flex items-center`}
                    title="Bookmarks"
                >
                    <Bookmark className="w-9 h-9" />
                    <span className="hide-mobile">Bookmarks</span>
                </button>

                <button
                    onClick={() => navigate("/notifications")}
                    className={`text-white gap-6 text-2xl font-bold p-3 transition duration-300 ml-6 w-[70%] hover:bg-zinc-800/30 rounded-4xl flex items-center`}
                    title="Notifications"
                >
                    <div className="relative flex items-center justify-center">
                        <Bell className="w-9 h-9" />
                        {notificationUnreadCount > 0 ? (
                            <div className="absolute -top-1 -right-2 flex items-center justify-center">
                                <div className="w-5 h-5 rounded-full bg-red-600 text-white text-xs font-medium flex items-center justify-center px-1">
                                    {notificationUnreadCount > 99 ? '99+' : notificationUnreadCount}
                                </div>
                            </div>
                        ) : null}
                    </div>
                    <span className="hide-mobile">Notifications</span>
                </button>
            </section>

            <div className="flex flex-col gap-2 mb-4 hide-settings-on-mobile">
                <button
                    className="text-white gap-6 text-2xl font-bold p-3 transition duration-300 ml-6 w-[70%] hover:bg-zinc-800/30 rounded-4xl flex items-center"
                    onClick={() => navigate("/settings")}
                    title="Settings"
                >
                    <Settings className="w-5 h-5" />
                    <span className="hide-mobile">Settings</span>
                </button>

                <button
                    className="text-white gap-6 text-1xl font-bold p-3 transition duration-300 ml-6 w-[70%] hover:bg-zinc-800/30 hover:shadow-md rounded-4xl flex items-center"
                    onClick={onLogout}
                    title="Logout"
                >
                    <LogOut className="w-5 h-5" />
                    <span className="hide-mobile">Logout</span>
                </button>
            </div>
        </nav>
    );
}

export default SidebarNav;