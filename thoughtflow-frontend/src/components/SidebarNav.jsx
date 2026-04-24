import { House, UserRound, Search, Mail, LogOut, Bookmark } from "lucide-react";
import logo from "../assets/logo.svg";

function SidebarNav({ activeButton, onSelect, onLogout }) {
    return (
        <nav className="fixed top-0 left-0 h-screen w-[20%] bg-black overflow-hidden">
            <header className="flex top-0 self-center w-[35%]">
                <img
                    src={logo}
                    alt="Logo Image"
                    className="ml-1 mt-1 w-full h-full object-cover rounded-lg"
                />
            </header>

            <section className="flex flex-col gap-2 mt-5">
                <button
                    className={`text-white gap-6 text-2xl font-bold p-3 transition duration-300 ml-6 w-[70%] ${activeButton === "home" ? "bg-zinc-800/30" : "hover:bg-zinc-800/30"} rounded-4xl flex items-center`}
                    onClick={() => onSelect("home")}
                >
                    <House className="w-9 h-9" />Home
                </button>

                <button
                    className={`text-white gap-6 text-2xl font-bold p-3 transition duration-300 ml-6 w-[70%] ${activeButton === "profile" ? "bg-zinc-800/30" : "hover:bg-zinc-800/30"} rounded-4xl flex items-center`}
                    onClick={() => onSelect("profile")}
                >
                    <UserRound className="w-9 h-9" />Profile
                </button>

                <button
                    className={`text-white gap-6 text-2xl font-bold p-3 transition duration-300 ml-6 w-[70%] ${activeButton === "explore" ? "bg-zinc-800/30" : "hover:bg-zinc-800/30"} rounded-4xl flex items-center`}
                    onClick={() => onSelect("explore")}
                >
                    <Search className="w-9 h-9" />Explore
                </button>

                <button
                    className={`text-white gap-6 text-2xl font-bold p-3 transition duration-300 ml-6 w-[70%] ${activeButton === "chats" ? "bg-zinc-800/30" : "hover:bg-zinc-800/30"} rounded-4xl flex items-center`}
                    onClick={() => onSelect("chats")}
                >
                    <Mail className="w-9 h-9" />Chats
                </button>

                <button
                    onClick={() => onSelect("bookmarks")}
                    className={`text-white gap-6 text-2xl font-bold p-3 transition duration-300 ml-6 w-[70%] ${activeButton === "bookmarks" ? "bg-zinc-800/30" : "hover:bg-zinc-800/30"} rounded-4xl flex items-center`}
                >
                    <Bookmark className="w-9 h-9" />Bookmarks
                </button>
            </section>

            <button
                className="text-white gap-6 text-1xl font-bold p-3 transition duration-300 ml-6 w-[70%] hover:bg-zinc-800/30 hover:shadow-md rounded-4xl flex items-center"
                onClick={onLogout}
            >
                <LogOut className="w-5 h-5" />Logout
            </button>
        </nav>
    );
}

export default SidebarNav;