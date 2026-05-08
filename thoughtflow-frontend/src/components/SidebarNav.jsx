import { House, UserRound, Search, Mail, LogOut, Bookmark, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.svg";

function SidebarNav({ activeButton, onSelect, onLogout }) {
    const navigate = useNavigate();
    
    return (
        <nav className="responsive-sidebar fixed top-0 left-0 h-screen w-[20%] bg-black overflow-hidden flex flex-col">
            <header className="flex text-white  -ml-50 top-0 self-center w-[35%]">
                <img
                    src={logo}
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
                    className={`text-white gap-6 text-2xl font-bold p-3 transition duration-300 ml-6 w-[70%] ${activeButton === "chats" ? "bg-zinc-800/30" : "hover:bg-zinc-800/30"} rounded-4xl flex items-center`}
                    onClick={() => onSelect("chats")}
                    title="Chats"
                >
                    <Mail className="w-9 h-9" />
                    <span className="hide-mobile">Chats</span>
                </button>

                <button
                    onClick={() => onSelect("bookmarks")}
                    className={`text-white gap-6 text-2xl font-bold p-3 transition duration-300 ml-6 w-[70%] ${activeButton === "bookmarks" ? "bg-zinc-800/30" : "hover:bg-zinc-800/30"} rounded-4xl flex items-center`}
                    title="Bookmarks"
                >
                    <Bookmark className="w-9 h-9" />
                    <span className="hide-mobile">Bookmarks</span>
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