import { House, UserRound, Search, Mail, LogOut, ArrowLeft, CalendarClockIcon } from "lucide-react";
import { useEffect, useState } from "react";
import ProfileEditCard from "../components/profileeditcard";
import PostCard from "../components/PostCard";

// Backend API root used for profile and posts requests.
const API_BASE = "http://127.0.0.1:8000";

// Reads auth token from localStorage and removes accidental wrapping quotes.
const getCleanToken = () => {
    const raw = localStorage.getItem("token");
    if (!raw) return "";
    return raw.replace(/^"|"$/g, "").trim();
};

// Converts relative media paths from backend into absolute browser URLs.
const toMediaUrl = (value) => {
    if (!value) return "";
    return value.startsWith("http") ? value : `${API_BASE}${value}`;
};

// Safely formats any date-like value for display in the profile UI.
const formatDate = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString();
};

function Profile() {
    // UI and data state for profile page.
    const [activeButton, setActiveButton] = useState("profile");
    const [profilePicture, setProfilePicture] = useState("");
    const [bannerPicture, setBannerPicture] = useState("");
    const [userData, setUserData] = useState(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [userPosts, setUserPosts] = useState([]);
    const [following, setFollowing] = useState(false);

    // Normalizes profile payload into local UI state.
    const applyProfileData = (data) => {
        setUserData(data);
        setProfilePicture(toMediaUrl(data.profile_image));
        setBannerPicture(toMediaUrl(data.banner_image));
    };

    // Small redirect helper for navigation buttons.
    const goTo = (path) => {
        window.location.href = path;
    };

    // Fetches current user profile, then loads posts for that user.
    const loadProfile = async () => {
        const token = getCleanToken();
        if (!token) return;

        try {
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
            applyProfileData(data);
            await loadUserPosts(data.username);
        } catch (error) {
            console.error("Failed to fetch user profile:", error);
        }
    };

    // Fetches all posts and keeps only those created by the current profile user.
    const loadUserPosts = async (username) => {
        const token = getCleanToken();
        if (!token || !username) return;

        try {
            const response = await fetch(`${API_BASE}/api/posts/`, {
                method: "GET",
                headers: {
                    Authorization: "Token " + token,
                },
            });

            if (!response.ok) {
                throw new Error(`Request failed with status ${response.status}`);
            }

            const allPosts = await response.json();
            const onlyUserPosts = allPosts.filter((post) => post.username === username);
            setUserPosts(onlyUserPosts);
        } catch (error) {
            console.error("Failed to fetch user posts:", error);
        }
    };

     //follow and unfollow handler (toggles state, no backend integration yet)
     const toggleFollow = () => {
        setFollowing((prev) => !prev);
    };


    // Sidebar button state handler (for visual active styles).
    const handleButtonClick = (buttonName) => {
        setActiveButton(buttonName);
    };

    // Clears auth token and returns to auth page.
    const handleLogout = () => {
        localStorage.removeItem("token");
        goTo("/");
    };

    // Guard route: if token is missing, push user back to login.
    useEffect(() => {
        const token = getCleanToken();
        if (!token) {
            goTo("/");
        }
    }, []);

    // Initial page load: fetch profile and user-specific posts.
    useEffect(() => {
        loadProfile();
    }, []);

    // Opens profile edit modal.
    const openEdit = () => {
        setIsEditOpen(true);
    };

    // Syncs page state after successful profile edit.
    const handleProfileUpdated = (data) => {
        applyProfileData(data);
        loadUserPosts(data.username);
    };

    return (
        <main className="bg-black w-full h-screen">
            <nav className="fixed top-0 left-0 h-screen w-[20%] bg-black border-r border-zinc-600 overflow-hidden">
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
                        onClick={() => {
                            handleButtonClick("home");
                            goTo("/home");
                        }}
                    >
                        <House className="w-9 h-9" />Home
                    </button>
                    <button
                        className={`text-white gap-6 text-2xl font-bold p-3 transition duration-300 ml-6 w-[70%] ${activeButton === "profile" ? "bg-zinc-800/30" : "hover:bg-zinc-800/30"} rounded-4xl flex items-center`}
                        onClick={() => {
                            handleButtonClick("profile");
                            goTo("/profile");
                        }}
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

            <section className="ml-[20%] flex h-screen w-[80%] overflow-y-auto overscroll-none posts-scrollbar bg-black">
                <article className="flex flex-col min-h-screen w-2/3 text-white border-zinc-500 border-l-[0.5px] border-r-[0.5px] relative">
                    <header className="flex w-full h-[8%]  bg-linear-to-r from-black-500 to-zinc-800 text-white items-center p-4">
                        <ArrowLeft className="w-6 h-6" onClick={() => goTo("/home")} />
                        <h1 className="text-2xl font-bold ml-4">Profile</h1>
                        <Search className="w-6 h-6 absolute right-8" />
                    </header>

                    <section className="flex flex-col w-full h-[80%]">
                        <section className="flex w-full h-[35%]  border-zinc-500 text-white items-center justify-center">
                            {bannerPicture ? (
                                <img src={bannerPicture} alt="Banner" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-zinc-900" />
                            )}
                        </section>

                        <div className="border-4 rounded-full absolute left-10 top-47 border-black w-45 h-45 z-10">
                            {profilePicture ? (
                                <img src={profilePicture} alt="Profile Image" className="w-full h-full object-cover rounded-full" />
                            ) : (
                                <div className="w-full h-full bg-zinc-800 rounded-full" />
                            )}
                        </div>

                        <section className="border border-zinc-500 w-full h-[80%] border-0.5">
                            <div className="flex flex-col w-full h-full mt-20 pl-5 pr-5 pt-5 gap-2">
                                <div className="flex items-start justify-between w-full">
                                    <div>
                                        <h1 className="text-3xl font-bold">{userData?.name}</h1>
                                        <h3 className=" text-zinc-500 ">@{userData?.username}</h3>
                                    </div>
                                    <button 
                                    className={`px-4 py-2 -ml-75 rounded-3xl bg-black border border-zinc-600 font-extrabold hover:text-white text-zinc-400  transition duration-300 ${following ? ' text-zinc-400 border-none' : ''}`}
                                    onClick={toggleFollow}
                                    >
                                        {following ? 'following' : 'Follow'}
                                    </button>
                                    <button
                                        className="px-4 py-2 rounded-3xl bg-black border border-zinc-600  hover:text-white text-zinc-400 hover:bg-zinc-800/30 transition duration-300"
                                        onClick={openEdit}
                                    >
                                        Edit Profile
                                    </button>
                                </div>
                                <p className="text-lg text-gray-400">{userData?.bio}</p>
                                <div className="flex fel-row gap-40">
                                    <h3 className=" text-zinc-500 pt-10">
                                        <CalendarClockIcon className="w-5 h-5 inline mr-2" />
                                        join date {formatDate(userData?.date_joined || userData?.created_at)}
                                    </h3>
                                    <h3 className="text-zinc-500 pt-10 ">Birthday :{formatDate(userData?.dob)} </h3>
                                </div>
                            </div>
                        </section>
                    </section>

                    <section className="w-full">
                        <div className="px-5 py-4 border-b border-zinc-800">
                            <h2 className="text-xl font-semibold">Posts</h2>
                        </div>
                        {userPosts.length > 0 ? (
                            userPosts.map((post) => <PostCard key={post.id} post={post} />)
                        ) : (
                            <p className="px-5 py-6 text-zinc-500">No posts yet.</p>
                        )}
                    </section>
                    <div><PostCard /></div>
                </article>

                <aside className="w-1/3 h-screen text-white border-r border-zinc-900 bg-black overflow-hidden">
                    <header className="h-[8%] px-4 flex items-center border-b border-zinc-900">
                        <h2 className="text-lg font-semibold">Chats</h2>
                    </header>

                    <section className="h-[72%] p-4 border-b border-zinc-900">
                        <article className="h-full w-full rounded-lg border border-zinc-900" />
                    </section>

                    <footer className="h-[20%] p-4">
                        <section className="h-full w-full rounded-lg border border-zinc-900" />
                    </footer>
                </aside>
            </section>
{isEditOpen && (
                <ProfileEditCard
                    userData={userData}
                    onClose={() => setIsEditOpen(false)}
                    onProfileUpdated={handleProfileUpdated}
                />
            )}
        
        </main>
    );
}

export default Profile;