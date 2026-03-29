import { useEffect, useState } from "react";

const API_BASE = "http://127.0.0.1:8000";

const getCleanToken = () => {
    const raw = localStorage.getItem("token");
    if (!raw) return "";
    return raw.replace(/^"|"$/g, "").trim();
};

function ProfileEditCard({ userData, onClose, onProfileUpdated }) {
    const [isSaving, setIsSaving] = useState(false);
    const [editAlert, setEditAlert] = useState({ type: "", message: "" });
    const [editProfileImage, setEditProfileImage] = useState(null);
    const [editBannerImage, setEditBannerImage] = useState(null);
    const [editForm, setEditForm] = useState({
        username: "",
        name: "",
        bio: "",
        dob: "",
    });

    useEffect(() => {
        setEditAlert({ type: "", message: "" });
        setEditProfileImage(null);
        setEditBannerImage(null);
        setEditForm({
            username: userData?.username || "",
            name: userData?.name || "",
            bio: userData?.bio || "",
            dob: userData?.dob || "",
        });
    }, [userData]);

    const handleEditSubmit = async (event) => {
        event.preventDefault();
        const token = getCleanToken();
        if (!token) {
            setEditAlert({ type: "error", message: "Please login again." });
            return;
        }

        setIsSaving(true);
        setEditAlert({ type: "", message: "" });

        const formData = new FormData();
        formData.append("username", editForm.username);
        formData.append("name", editForm.name);
        formData.append("bio", editForm.bio);
        formData.append("dob", editForm.dob);

        if (editProfileImage) {
            formData.append("profile_image", editProfileImage);
        }
        if (editBannerImage) {
            formData.append("banner_image", editBannerImage);
        }

        try {
            const response = await fetch(`${API_BASE}/api/profile/update/`, {
                method: "POST",
                headers: {
                    Authorization: "Token " + token,
                },
                body: formData,
            });

            let data = {};
            try {
                data = await response.json();
            } catch {
                data = {};
            }

            if (!response.ok) {
                throw new Error(data?.error || "Failed to update profile");
            }

            if (onProfileUpdated) {
                onProfileUpdated(data);
            }

            setEditAlert({ type: "success", message: "Profile updated successfully." });
            setTimeout(() => {
                setEditAlert({ type: "", message: "" });
                onClose();
            }, 700);
        } catch (error) {
            setEditAlert({ type: "error", message: error.message || "Failed to update profile" });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <form onSubmit={handleEditSubmit} className="w-[92%] max-w-2xl bg-zinc-900 border border-zinc-700 rounded-2xl p-5 text-white">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Edit Profile</h2>
                    <button type="button" onClick={onClose} className="text-zinc-400 hover:text-white">
                        Close
                    </button>
                </div>

                {editAlert.message ? (
                    <div className={`w-full rounded-lg px-4 py-2 text-sm mb-4 ${editAlert.type === "error" ? "bg-red-900/40 text-red-200 border border-red-500/40" : "bg-green-900/40 text-green-200 border border-green-500/40"}`}>
                        {editAlert.message}
                    </div>
                ) : null}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-zinc-400 mb-1">Username</label>
                        <input
                            type="text"
                            value={editForm.username}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, username: e.target.value }))}
                            className="w-full rounded-lg bg-zinc-800 border border-zinc-700 p-2"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-zinc-400 mb-1">Name</label>
                        <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                            className="w-full rounded-lg bg-zinc-800 border border-zinc-700 p-2"
                        />
                    </div>
                    <div>
                        <label className="block text-zinc-400 mb-1">Date of Birth</label>
                        <input
                            type="date"
                            value={editForm.dob || ""}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, dob: e.target.value }))}
                            className="w-full rounded-lg bg-zinc-800 border border-zinc-700 p-2"
                            max={new Date().toISOString().split("T")[0]}
                        />
                    </div>
                    <div>
                        <label className="block text-zinc-400 mb-1">Profile Picture</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setEditProfileImage(e.target.files?.[0] || null)}
                            className="w-full rounded-lg bg-zinc-800 border border-zinc-700 p-2"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-zinc-400 mb-1">Banner Picture</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setEditBannerImage(e.target.files?.[0] || null)}
                            className="w-full rounded-lg bg-zinc-800 border border-zinc-700 p-2"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-zinc-400 mb-1">Bio</label>
                        <textarea
                            value={editForm.bio}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, bio: e.target.value.slice(0, 200) }))}
                            className="w-full rounded-lg bg-zinc-800 border border-zinc-700 p-2 min-h-24"
                        />
                    </div>
                </div>

                <div className="flex justify-end mt-4 gap-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-3xl bg-zinc-700 hover:bg-zinc-600">
                        Cancel
                    </button>
                    <button type="submit" disabled={isSaving} className="px-4 py-2 rounded-3xl bg-white text-black disabled:opacity-60 disabled:cursor-not-allowed">
                        {isSaving ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default ProfileEditCard;