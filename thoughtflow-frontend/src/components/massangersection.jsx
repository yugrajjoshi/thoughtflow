import React from "react";
import { Search, MessageSquareText, Phone, MoreHorizontal } from "lucide-react";


const API_BASE = "http://127.0.0.1:8000";

const getCleanToken = () => {
    const rawToken = localStorage.getItem("token");
    return rawToken ? rawToken.replace(/^"|"$/g, "").trim() : "";
};

const massangerData = [
    {
        id: 1,
        name: "John Doe",
        lastMessage: "Hey, how are you doing?",
        time: "10:30 AM",
        unread: 2
    },
    {
        id: 2,
        name: "Jane Smith",
        lastMessage: "See you tomorrow!",
        time: "9:15 AM",
        unread: 0
    }
];

function MassangerSection() {
    return (
        <main className="w-full p-2 h-full flex flex-col">
            <div className="border w-full h-[10%] felx flex-row">
                <div><img  /></div>
            </div>

        </main>
    );
}

export default MassangerSection;