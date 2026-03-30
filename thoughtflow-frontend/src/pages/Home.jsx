import React, { useEffect, useState } from 'react';
import { House, UserRound, Search, Mail, LogOut,Bookmark } from "lucide-react";
import CreatePost from "../components/Createpost";
import PostCard from '../components/PostCard';
import Bookmarks from '../components/Bookmarks';

const API_BASE = "http://127.0.0.1:8000";

const getCleanToken = () => {
  const rawToken = localStorage.getItem("token");
  return rawToken ? rawToken.replace(/^"|"$/g, "").trim() : "";
};

function Home() {
  const [loginStatus, setLoginStatus] = useState(() => Boolean(localStorage.getItem("token")));
  const [profilePicture, setProfilePicture] = useState(null);
  const [posts, setPosts] = useState([]);
  const [activeButton, setActiveButton] = useState("home");

  const goTo = (path) => {
    window.location.href = path;
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    setLoginStatus(Boolean(token));

    if (!token) {
      goTo("/");
    }
  }, [loginStatus]);

  if (!loginStatus) {
    return null;
  }

  const fetchProfile = async () => {
    try {
      const token = getCleanToken();
      const response = await fetch(`${API_BASE}/api/profile/`, {
        method: "GET",
        headers: {
          Authorization: "Token " + token,
        },
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = await response.json();
      setProfilePicture(data.profile_image);
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
    }
  };

  const fetchPosts = async () => {
    try {
      const token = getCleanToken();

      const response = await fetch(`${API_BASE}/api/posts/`, {
        method: "GET",
        headers: {
          Authorization: "Token " + token,
        },
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = await response.json();
      setPosts(data);
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchPosts();
  }, []);

  const handleButtonClick = (buttonName) => {
    setActiveButton(buttonName);
  };

  function handleLogout() {
    localStorage.removeItem("token");
    goTo("/");
  }

  useEffect(() => {
    setActiveButton("For You");
  }, []);

  //search functionality
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchChange = (e) => {
    setSearchQuery(event.target.value);
  };


  return (
    <main className="bg-black w-full h-screen overflow-hidden">
      <nav className="fixed top-0 left-0 h-screen w-[20%] bg-black overflow-hidden">
        <header className="flex top-0 self-center w-[35%]">
            <img
              src="src/assets/logo.svg"
              alt="Logo Image"
              className=" ml-1 mt-1 w-full h-full object-cover rounded-lg"
            />
         </header>
         <section className="flex flex-col gap-2 mt-5">
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
               goTo("/profile");
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
           <button
           onClick={()=>handleButtonClick("bookmarks")}
             className={`text-white gap-6 text-2xl font-bold p-3 transition duration-300 ml-6 w-[70%] ${activeButton === "bookmarks" ? "bg-zinc-800/30 " : "hover:bg-zinc-800/30 "} rounded-4xl flex items-center`}>
              <Bookmark className="w-9 h-9" />Bookmarks
           </button>
         </section>
           <button className = "text-white gap-6 text-1xl font-bold p-3 transition duration-300 ml-6 w-[70%] hover:bg-zinc-800/30 hover:shadow-md  rounded-4xl  flex items-center" onClick={handleLogout}>
             <LogOut className="w-5 h-5" />Logout
           </button>
      </nav>

      <section className="ml-[20%] flex h-screen w-[80%] overflow-hidden">
        <article className="flex flex-col h-screen w-2/3 text-white border-zinc-900 border-l border-r overflow-hidden">
        <header className= "flex w-full h-[8%]  " >
          <button className= {`text-zinc-400 transition-all duration-200 hover:text-white w-[50%] ${activeButton === "For You" ?"bg-linear-to-r from-zinc-950 to-zinc-900":"bg-black"}`}
           onClick={() => setActiveButton("For You")}> For You</button>
          <button className= {`text-zinc-400 transition-all duration-200 hover:text-white  w-[50%] ${activeButton === "Following" ?"bg-linear-to-l from-zinc-950 to-zinc-900":"bg-black "}`}
           onClick={() => setActiveButton("Following")}>
            Following
          </button>
        </header>
        <section className="shrink-0 ">
          <CreatePost
            profilePicture={profilePicture}
            onPostCreated={(createdPost) => setPosts((prevPosts) => [createdPost, ...prevPosts])}
          />
        </section>
        <section className="flex-1 overflow-y-auto posts-scrollbar">
          {posts.filter((post) => post.content.includes(searchQuery)).map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </section>
        </article>
        <aside className="flex border  h-screen w-1/3 text-white bg-black ">
          <button 
            className=" flex flex-row gap-5 mt-5 justify m-5 items-center w-full h-12 border rounded-4xl ">
            <Search className=" ml-5 w-5 h-5" />
            <input
              type="text"
              placeholder="Search"
              className="bg-black w-full h-full text-zinc-300 placeholder:text-zinc-500 focus:outline-none rounded-4xl"
              onChange={(e)=> setSearchQuery(e.target.value)}
            />
          </button>
      </aside>
      </section>
    </main>
  );
}

export default Home;