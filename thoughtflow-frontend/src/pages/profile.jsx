import React, { use } from "react";
import { House, UserRound, Search, Mail, LogOut, ArrowLeft } from "lucide-react";
import { useState,useEffect } from "react";

function Profile() {
    const[activeButton, setActiveButton] = useState("profile");
    const[username, setUsername] = useState("");
  const handleButtonClick = (buttonName) => {
    setActiveButton(buttonName);
  };
  function handleLogout() {
    localStorage.removeItem("token");
    window.location.href = "/";
  }

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch("http://127.0.0.1:8000/admin/auth/user/", { 
      headers: {
        "Authorization": "Token" + token
      }
    })
    .then(response => response.json())
    .then(data => {
      setUsername(data.username);
    });
  }, []);

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
            <div className="flex flex-col min-h-screen w-2/3 text-white border-l-[0.5px] border-r-[0.5px] relative">
                <div className="flex w-full h-[8%]  bg-linear-to-r from-black-500 to-zinc-800 text-white items-center p-4">
                    <ArrowLeft className="w-6 h-6" onClick={() => (window.location.href = "/home")} /> 
                    <h1 className="text-2xl font-bold ml-4">Profile</h1>
                    <Search className="w-6 h-6 absolute right-8" />
                </div>
               <div className="flex flex-col w-full h-[80%]">
                <div className="flex w-full h-[35%]  border-white text-white items-center justify-center">
                    <img src = "src/assets/killuaubasi.png " className= "w-full h-full object-cover" ></img>
                </div>
                <div className="border-4 rounded-full absolute left-10 top-47 border-black w-45 h-45 z-10">
                    <img src="src/assets/killuaubasi.png" alt="Profile Image" className="w-full h-full object-cover rounded-full"></img>
                </div>
                <div className="border-b border-white w-full h-[80%] border-0.5">
                    <div className="flex flex-col w-full h-full mt-20 pl-5 pt-5 gap-2">
                        <h1 className="text-3xl font-bold">Yugraj</h1>
                        <h3 className=" text-zinc-500 " >{username}</h3>
                        <p className="text-lg text-gray-400">A person who drains the energy of the front one better stay better after an intraction.</p>
                    </div>
                </div>
            </div>
         </div> 
        </div>
    </main>
);
}

export default Profile;