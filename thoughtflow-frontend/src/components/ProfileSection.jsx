import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CalendarClockIcon, Balloon, Search } from "lucide-react";
import PostCard from "./PostCard";
import ProfileEditCard from "./profileeditcard";
import FollowingList from "./followinglist";

const API_BASE = "http://127.0.0.1:8000";

const getCleanToken = () => {
    const raw = localStorage.getItem("token");
    if (!raw) return "";
    return raw.replace(/^"|"$/g, "").trim();
};

const toMediaUrl = (value) => {
    if (!value) return "";
    return value.startsWith("http") ? value : `${API_BASE}${value}`;
};

const formatDate = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString();
};

function ProfileSection({
    viewedUsername,
    currentUsername,
    currentUserId,
    posts,
    onBackHome,
    onNavigateProfile,
    onOpenPost,
    onDeletePost,
    onPostUpdated,
    deletingPostIds,
    onOwnProfileUpdated,
}) {
    const [userData, setUserData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [following, setFollowing] = useState(false);
    const [isFollowLoading, setIsFollowLoading] = useState(false);
    const [relationshipTab, setRelationshipTab] = useState(null);
    const [followingPeople, setFollowingPeople] = useState([]);
    const [followersPeople, setFollowersPeople] = useState([]);
    const [relationshipLoading, setRelationshipLoading] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);

    const isOwnProfile = !viewedUsername || viewedUsername === currentUsername;
    const usernameForPosts = userData?.username || "";
    const userIdForPosts = Number(userData?.user_id) || null;

    const userPosts = useMemo(() => {
        if (!usernameForPosts) {
            return [];
        }

        const repostLabel = userData?.name || userData?.username || "User";

        return posts
            .filter((post) => {
                const isOriginalPost = post.username === usernameForPosts;
                const repostUsers = Array.isArray(post?.repost_users) ? post.repost_users.map(Number) : [];
                const isRepostedByViewedUser = Boolean(userIdForPosts) && repostUsers.includes(userIdForPosts) && !isOriginalPost;

                return isOriginalPost || isRepostedByViewedUser;
            })
            .map((post) => {
                const isOriginalPost = post.username === usernameForPosts;
                if (isOriginalPost) {
                    return { ...post, reposted_by_label: "" };
                }

                return {
                    ...post,
                    reposted_by_label: repostLabel,
                };
            });
    }, [posts, usernameForPosts, userIdForPosts, userData?.name, userData?.username]);

    const loadRelationshipLists = async (targetUsername) => {
        const token = getCleanToken();
        if (!token || !targetUsername) return;

        setRelationshipLoading(true);
        try {
            const [followingResponse, followersResponse] = await Promise.all([
                fetch(`${API_BASE}/api/profile/${targetUsername}/following/`, {
                    headers: {
                        Authorization: "Token " + token,
                    },
                }),
                fetch(`${API_BASE}/api/profile/${targetUsername}/followers/`, {
                    headers: {
                        Authorization: "Token " + token,
                    },
                }),
            ]);

            if (!followingResponse.ok || !followersResponse.ok) {
                throw new Error("Failed to load relationship lists");
            }

            const followingData = await followingResponse.json();
            const followersData = await followersResponse.json();

            setFollowingPeople(followingData.results || []);
            setFollowersPeople(followersData.results || []);
        } catch (error) {
            console.error("Failed to fetch relationship lists:", error);
            setFollowingPeople([]);
            setFollowersPeople([]);
        } finally {
            setRelationshipLoading(false);
        }
    };

    const loadProfile = async () => {
        const token = getCleanToken();
        if (!token) return;

        setIsLoading(true);
        try {
            const endpoint = isOwnProfile
                ? `${API_BASE}/api/profile/`
                : `${API_BASE}/api/profile/${viewedUsername}/`;

            const response = await fetch(endpoint, {
                method: "GET",
                headers: {
                    Authorization: "Token " + token,
                },
            });

            if (!response.ok) {
                throw new Error(`Request failed with status ${response.status}`);
            }

            const data = await response.json();
            setUserData(data);
            setFollowing(Boolean(data.is_following));
            await loadRelationshipLists(data.username);
        } catch (error) {
            console.error("Failed to fetch profile:", error);
            setUserData(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadProfile();
    }, [viewedUsername, currentUsername]);

    const handleFollowAction = async () => {
        if (!viewedUsername) return;

        setIsFollowLoading(true);
        try {
            const token = getCleanToken();
            const endpoint = following
                ? `${API_BASE}/api/profile/unfollow/${viewedUsername}/`
                : `${API_BASE}/api/profile/follow/${viewedUsername}/`;

            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    Authorization: "Token " + token,
                },
            });

            if (!response.ok) {
                throw new Error("Failed to update follow status");
            }

            const data = await response.json();
            setFollowing(Boolean(data.followed));
            await loadProfile();
        } catch (error) {
            console.error("Failed to update follow state:", error);
        } finally {
            setIsFollowLoading(false);
        }
    };

    const handleProfileUpdated = (data) => {
        setUserData(data);
        if (typeof onOwnProfileUpdated === "function") {
            onOwnProfileUpdated(data);
        }
        loadRelationshipLists(data.username);
    };

    if (isLoading) {
        return <div className="text-zinc-500 p-6 text-center">Loading profile...</div>;
    }

    if (!userData) {
        return <div className="text-red-400 p-6 text-center">Unable to load profile.</div>;
    }

    return (
        <section className="w-full h-full overflow-y-auto posts-scrollbar">
            <article className="flex flex-col min-h-full text-white border-zinc-900 border-l border-r relative">
                <header className="flex w-full h-16 bg-linear-to-r from-black to-zinc-800 text-white items-center p-4">
                    <ArrowLeft className="w-6 h-6 cursor-pointer" onClick={onBackHome} />
                    <h1 className="text-2xl font-bold ml-4">{userData?.name || userData?.username}</h1>
                    <Search className="w-6 h-6 absolute right-8" />
                </header>

                <section className="flex flex-col w-full">
                    <section className="flex w-full h-56 md:h-72 items-center justify-center">
                        {userData?.banner_image ? (
                            <img src={toMediaUrl(userData.banner_image)} alt="Banner" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-zinc-900" />
                        )}
                    </section>

                    <div className="border-6 rounded-full absolute left-10 top-64 border-black w-36 h-36 md:w-45 md:h-45 z-10 overflow-hidden bg-zinc-800">
                        {userData?.profile_image ? (
                            <img src={toMediaUrl(userData.profile_image)} alt="Profile Image" className="w-full h-full object-cover rounded-full" />
                        ) : null}
                    </div>

                    <section className="border-b border-zinc-600 w-full pb-5">
                        <div className="flex flex-col w-full h-full mt-16 md:mt-20 pl-5 pr-5 pt-5 gap-2">
                            <div className="flex items-start justify-between w-full gap-3">
                                <div className="min-w-0">
                                    <h1 className="text-3xl font-bold truncate">{userData?.name || userData?.username}</h1>
                                    <h3 className="text-zinc-500 truncate">@{userData?.username}</h3>
                                </div>

                                {isOwnProfile ? (
                                    <button
                                        className="px-4 py-2 rounded-3xl bg-black border border-zinc-600 hover:text-white text-zinc-400 hover:bg-zinc-800/30 transition duration-300"
                                        onClick={() => setIsEditOpen(true)}
                                    >
                                        Edit Profile
                                    </button>
                                ) : (
                                    <button
                                        className={`px-4 py-2 rounded-3xl bg-black border border-zinc-600 font-extrabold hover:text-white text-zinc-400 transition duration-300 ${following ? "text-zinc-400 border-none" : ""}`}
                                        onClick={handleFollowAction}
                                        disabled={isFollowLoading}
                                    >
                                        {isFollowLoading ? "Loading..." : following ? "Following" : "Follow"}
                                    </button>
                                )}
                            </div>

                            <p className="text-lg text-gray-400 whitespace-pre-wrap">{userData?.bio || "No bio yet."}</p>

                            <div className="flex flex-row gap-8 flex-wrap">
                                <h3 className="text-zinc-500 pt-4">
                                    <CalendarClockIcon className="w-5 h-5 inline mr-2" />
                                    join date {formatDate(userData?.date_joined || userData?.created_at)}
                                </h3>
                                <h3 className="text-zinc-500 pt-4">
                                    <Balloon className="w-5 h-5 inline mr-2" />
                                    Born on: {formatDate(userData?.dob) || "Not set"}
                                </h3>
                            </div>

                            <div className="p-1 gap-4 flex pt-2 flex-wrap">
                                <button
                                    type="button"
                                    onClick={() => setRelationshipTab((current) => (current === "following" ? null : "following"))}
                                    className={`text-zinc-400 font-bold px-4 py-2 rounded-full border transition ${relationshipTab === "following" ? "border-zinc-500 bg-zinc-800/60" : "border-zinc-800 hover:border-zinc-600"}`}
                                >
                                    Following {userData?.following?.length ?? 0}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRelationshipTab((current) => (current === "followers" ? null : "followers"))}
                                    className={`text-zinc-400 font-bold px-4 py-2 rounded-full border transition ${relationshipTab === "followers" ? "border-zinc-500 bg-zinc-800/60" : "border-zinc-800 hover:border-zinc-600"}`}
                                >
                                    Followers {userData?.followers?.length ?? 0}
                                </button>
                            </div>

                            {relationshipTab ? (
                                <div className="pt-4">
                                    {relationshipLoading ? (
                                        <p className="text-sm text-zinc-500">Loading people list...</p>
                                    ) : (
                                        <FollowingList
                                            title={relationshipTab === "following" ? "Following" : "Followers"}
                                            people={relationshipTab === "following" ? followingPeople : followersPeople}
                                            emptyMessage={relationshipTab === "following" ? "No following users yet." : "No followers yet."}
                                            onPersonClick={onNavigateProfile}
                                        />
                                    )}
                                </div>
                            ) : null}
                        </div>
                    </section>
                </section>

                <section className="w-full">
                    <div className="px-5 py-4 border-b border-zinc-800">
                        <h2 className="text-xl font-semibold">Posts</h2>
                    </div>

                    {userPosts.length > 0 ? (
                        userPosts.map((post) => (
                            <PostCard
                                key={post.id}
                                post={post}
                                onClick={onOpenPost}
                                currentUsername={currentUsername}
                                currentUserId={currentUserId}
                                onDeletePost={onDeletePost}
                                onPostUpdated={onPostUpdated}
                                isDeletingPost={deletingPostIds.includes(post.id)}
                            />
                        ))
                    ) : (
                        <p className="px-5 py-6 text-zinc-500">No posts yet.</p>
                    )}
                </section>
            </article>

            {isOwnProfile && isEditOpen ? (
                <ProfileEditCard
                    userData={userData}
                    onClose={() => setIsEditOpen(false)}
                    onProfileUpdated={handleProfileUpdated}
                />
            ) : null}
        </section>
    );
}

export default ProfileSection;