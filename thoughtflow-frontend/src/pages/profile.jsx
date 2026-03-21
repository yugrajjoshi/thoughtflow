import React from "react";
import { House, UserRound, Search, Mail, LogOut, ArrowLeft } from "lucide-react";
import { useState } from "react";

function Profile() {
    const[activeButton, setActiveButton] = useState("profile");

  const handleButtonClick = (buttonName) => {
    setActiveButton(buttonName);
  };
  function handleLogout() {
    localStorage.removeItem("token");
    window.location.href = "/";
  }
return (
    <main className="bg-black w-full h-screen">
        <nav className="fixed top-0 left-0 h-screen w-[20%] bg-black border-r overflow-hidden">
                <div className="flex top-0 self-center w-[35%]">
                    <img
                        src="src/assets/logo.svg"
                        alt="Logo Image"
                        className="ml-1 mt-1 w-full h-full object-cover rounded-lg"
                    />
                </div>
                <div className="flex flex-col gap-2 mt-5">
                    <button 
                        className={`text-white gap-6 text-2xl font-bold p-3 transition duration-300 ml-6 w-[70%] ${activeButton === "home" ? "bg-zinc-800/30" : "hover:bg-zinc-800/30"} rounded-4xl flex items-center`}
                        onClick={() => {handleButtonClick("home"); window.location.href = "/home";}}
                    >
                        <House className="w-9 h-9" />Home
                    </button>
                    <button 
                        className={`text-white gap-6 text-2xl font-bold p-3 transition duration-300 ml-6 w-[70%] ${activeButton === "profile" ? "bg-zinc-800/30" : "hover:bg-zinc-800/30"} rounded-4xl flex items-center`}
                        onClick={() => {handleButtonClick("profile"); window.location.href = "/profile";}}
                    >
                        <UserRound className="w-9 h-9" />Profile
                    </button>
                    <button 
                        className={`text-white gap-6 text-2xl font-bold p-3 transition duration-300 ml-6 w-[70%] ${activeButton === "explore" ? "bg-zinc-800/30" : "hover:bg-zinc-800/30"} rounded-4xl flex items-center`}
                        onClick={() => handleButtonClick("explore")}
                    >
                        <Search className="w-9 h-9" />Explore
                    </button>
                    <button 
                        className={`text-white gap-6 text-2xl font-bold p-3 transition duration-300 ml-6 w-[70%] ${activeButton === "chats" ? "bg-zinc-800/30" : "hover:bg-zinc-800/30"} rounded-4xl flex items-center`}
                        onClick={() => handleButtonClick("chats")}
                    >
                        <Mail className="w-9 h-9" />Chats
                    </button>
                </div>
                <button className="text-white gap-6 text-1xl font-bold p-3 transition duration-300 ml-6 w-[70%] hover:bg-zinc-800/30 hover:shadow-md rounded-4xl flex items-center" onClick={handleLogout}>
                    <LogOut className="w-5 h-5" />Logout
                </button>
        </nav>
        <div className="ml-[20%] flex h-screen w-[80%] overflow-y-auto">
            <div className="flex flex-col min-h-screen w-2/3 text-white border-white border-l border-r relative">
                <div className="flex w-full h-[8%] border-b text-white items-center p-4">
                    <ArrowLeft className="w-6 h-6" /> 
                </div>
               <div className="flex flex-col w-full h-[80%]">
                <div className="flex w-full h-[35%] border-0.5 border border-white text-white items-center p-4">
                    <img></img>
                </div>
                <div className="border-2 rounded-full absolute left-10 top-50 border-black w-40 h-40 z-10">
                    <img src="src/assets/killuaubasi.png" alt="Profile Image" className="w-full h-full object-cover rounded-full"></img>
                </div>
                <div className="border border-white border-0.5"></div>
            </div>
            <div className="flex w-full text-white  border-white border">
                search
            </div>
         </div> 
        </div>
    </main>
);
}

export default Profile;