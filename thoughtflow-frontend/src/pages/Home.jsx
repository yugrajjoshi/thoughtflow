import React, { useEffect, useState } from 'react';
import  { House , UserRound, Search, Mail, LogOut } from "lucide-react";




function Home() {
  const [loginStatus, setLoginStatus] = useState(() => Boolean(localStorage.getItem("token")));

  useEffect(() => {
    const token = localStorage.getItem("token");
    setLoginStatus(Boolean(token));

    if (!token) {
      window.location.href = "/";
    }
  }, []);

  if (!loginStatus) {
    return null;
  }

  // buttons controls
  const[activeButton, setActiveButton] = useState("home");

  const handleButtonClick = (buttonName) => {
    setActiveButton(buttonName);
  };
  function handleLogout() {
    localStorage.removeItem("token");
    window.location.href = "/";
  }

  const [username,setActivebu] = useState("For You");

  return (
    <main className="bg-black w-full h-screen ">
      <nav className="fixed top-0 left-0 h-screen w-[20%] bg-black border-r overflow-hidden">
          <div className="flex top-0 self-center w-[35%]">
            <img
              src="src/assets/logo.svg"
              alt="Logo Image"
              className=" ml-1 mt-1 w-full h-full object-cover rounded-lg"
      
            />
         </div><div className="flex flex-col gap-2 mt-5">
            <button 
              className={`text-white gap-6 text-2xl font-bold p-3 transition duration-300 ml-6 w-[70%] ${activeButton === "home" ? "bg-zinc-800/30 " : "hover:bg-zinc-800/30  "} rounded-4xl flex items-center`}
              onClick={() => handleButtonClick("home")}
            >
             <House className="w-9 h-9" />Home
           </button>
           <button 
             className={`text-white gap-6 text-2xl font-bold p-3 transition duration-300 ml-6 w-[70%] ${activeButton === "profile" ? "bg-zinc-800/30 " : "hover:bg-zinc-800/30 "} rounded-4xl flex items-center`}
             onClick={() => {
               handleButtonClick("profile");
               window.location.href = "/profile";
             }}
           >
             <UserRound className="w-9 h-9" />Profile
           </button>
           <button 
             className={`text-white gap-6 text-2xl font-bold p-3 transition duration-300 ml-6 w-[70%] ${activeButton === "explore" ? "bg-zinc-800/30 " : "hover:bg-zinc-800/30 "} rounded-4xl flex items-center`}
             onClick={() => handleButtonClick("explore")}
           >
             <Search className="w-9 h-9" />Explore
           </button>
           <button 
             className={`text-white gap-6 text-2xl font-bold p-3 transition duration-300 ml-6 w-[70%] ${activeButton === "chats" ? "bg-zinc-800/30 " : "hover:bg-zinc-800/30 "} rounded-4xl flex items-center`}
             onClick={() => handleButtonClick("chats")}
           >
             <Mail className="w-9 h-9" />Chats
           </button>
           </div>
           <button className = "text-white gap-6 text-1xl font-bold p-3 transition duration-300 ml-6 w-[70%] hover:bg-zinc-800/30 hover:shadow-md  rounded-4xl  flex items-center" onClick={handleLogout}>
             <LogOut className="w-5 h-5" />Logout
           </button>
      </nav>
      <div className="ml-[20%] flex h-screen w-[80%] overflow-y-auto">
        <div className="flex flex-col min-h-screen w-2/3 text-white border-white border-l border-r">
        <div className= "flex w-full h-[8%]  " >
          <button className= {`text-zinc-400 transition-all duration-200 hover:text-white w-[50%] ${activeButton === " For You" ?"bg-linear-to-r from-zinc-950 to-zinc-900":"bg-black"}`} 
           onClick={() => setActiveButton(" For You")}> For You</button>
          <button className= {`text-zinc-400 transition-all duration-200 hover:text-white  w-[50%] ${activeButton === "Following" ?"bg-linear-to-l from-zinc-950 to-zinc-900":"bg-black "}`} 
           onClick={() => setActiveButton("Following")}>
            Following
          </button>
        </div>
        <div className=" flex  w-full h-auto border border-zinc-900 p-3 ">
          <div className="flex flex-row gap-10">
            <div className= "flex felx-row w-15 border-black h-15 rounded-full ">
              <img src="src/assets/killuaubasi.png" alt="Profile Image" className="w-full h-full object-cover rounded-full"></img>
              </div>
          </div>
            </div>
        </div>
        <div className="flex min-h-screen w-1/3 text-white bg-black border">
          search
        </div>
      </div>
    </main>
  );
}

export default Home;