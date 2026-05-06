import { useEffect, useState } from "react";

function Profilesetup() {
    const [profilePicture, setProfilePicture] = useState(null);
    const [bio, setBio] = useState("");
    const [dob, setDob] = useState(""); 
    const [name, setName] = useState("");
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [inlineAlert, setInlineAlert] = useState({ type: "", message: "" });

   useEffect(() => {
    const rawToken = localStorage.getItem("token");
    const token = rawToken ? rawToken.replace(/^"|"$/g, "").trim() : "";

    if (!token || token === "undefined" || token === "null") {
        localStorage.removeItem("token");
        setTimeout(() => {
            window.location.href = "/";
        }, 1000);
        return;
    }

    fetch("http://127.0.0.1:8000/api/user/", {
        method: "GET",
        headers: {
            "Authorization": `Token ${token}`,
        },
    })
      .then((response) => {
        if (!response.ok) {
            throw new Error("Invalid token");
        }
        setIsCheckingAuth(false);
      })
      .catch(() => {
        localStorage.removeItem("token");
                setTimeout(() => {
                        window.location.href = "/";
                }, 1200);
      });
   }, []);

   function handleSubmit(event) {
    event.preventDefault();
    setInlineAlert({ type: "", message: "" });

    // 1️⃣ Get token
    const rawToken = localStorage.getItem("token");
    const token = rawToken ? rawToken.replace(/^"|"$/g, "").trim() : "";
    if (!token || token === "undefined" || token === "null") {
        localStorage.removeItem("token");
        setInlineAlert({ type: "error", message: "Please login first." });
        setTimeout(() => {
            window.location.href = "/";
        }, 1000);
        return;
    }

    // 2️⃣ Create FormData
    const formData = new FormData();
       formData.append("name", name);
       formData.append("bio", bio);
       formData.append("dob", dob);
    if (profilePicture) {
        formData.append("profile_image", profilePicture);
    }

    // 5️⃣ Fetch request
    setIsSubmitting(true);

    fetch("http://127.0.0.1:8000/api/profile/update/", {
        method: "POST",
        headers: {
            "Authorization": `Token ${token}`
        },
        body: formData
    })

    // 6️⃣ Convert response and surface non-2xx errors
    .then(async (response) => {
        let data = {};
        try {
            data = await response.json();
        } catch {
            data = {};
        }

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem("token");
                setInlineAlert({ type: "error", message: "Session expired. Please login again." });
                setTimeout(() => {
                    window.location.href = "/";
                }, 1200);
                throw new Error("Unauthorized");
            }
            const message = data?.error || "Failed to update profile";
            throw new Error(message);
        }
        return data;
    })

    // 7️⃣ Handle success
    .then(data => {
        console.log(data);
        console.log("Profile updated successfully!");
        setInlineAlert({ type: "success", message: "Profile updated successfully! Redirecting..." });
        setTimeout(() => {
            window.location.href = "/profile";
        }, 900);
    })

    // 8️⃣ Handle error
    .catch(error => {
        if (error.message !== "Unauthorized") {
            setInlineAlert({ type: "error", message: error.message || "Failed to update profile" });
        }
        console.error(error);
    })
    .finally(() => {
        setIsSubmitting(false);
    });
}

    if (isCheckingAuth) {
        return (
            <main className="bg-black w-full min-h-screen flex items-center justify-center text-zinc-300">
                Checking session...
            </main>
        );
    }

    return (
        <main className="bg-black w-full min-h-screen flex flex-col md:flex-row items-center justify-center">
            <img 
                src="src/assets/logo.svg" 
                alt="Logo Image" 
                className="w-24 h-24 md:w-1/2 md:h-screen object-cover rounded-lg md:rounded-none shrink-0 mb-4 md:mb-0" 
            />

            <div className="w-full md:w-1/2 flex items-center justify-center p-4 md:p-8">
            <div className="w-full max-w-md">
                <div className="flex bg-zinc-700 p-6 sm:p-8 rounded-2xl justify-center items-center">
                    <div className="flex flex-col w-full p-4 sm:p-6 rounded-lg bg-zinc-800 shadow-lg items-center">
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 text-center">Complete Your Profile</h2>
                        
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
                            {inlineAlert.message ? (
                                <div
                                    className={`w-full rounded-lg px-4 py-2 text-sm ${inlineAlert.type === "error" ? "bg-red-900/40 text-red-200 border border-red-500/40" : "bg-green-900/40 text-green-200 border border-green-500/40"}`}
                                >
                                    {inlineAlert.message}
                                </div>
                            ) : null}

                            {/* Profile Picture Section */}
                            <div className="flex justify-center mb-4">
                                <label className="shadow-lg cursor-pointer overflow-hidden flex items-center justify-center border-2 border-zinc-500 rounded-full w-24 h-24 sm:w-32 sm:h-32 hover:border-zinc-300 transition">
                                   <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setProfilePicture(e.target.files[0])}
                                    className="hidden"
                                    />
                                    {profilePicture ? (
                                        <img src={URL.createObjectURL(profilePicture)} alt="Profile Preview" className="w-full h-full object-cover rounded-full" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs text-center">Add photo</div>
                                    )}
                                </label>
                            </div>
                            
                            {/* Name Field */}
                            <div className="w-full">
                                <label className="text-zinc-300 text-sm font-medium block mb-2">Name <span className="text-red-500">*</span></label>
                                <input 
                                    type="text" 
                                    placeholder="Enter your name" 
                                    className="w-full bg-zinc-700 text-white placeholder:text-zinc-400 outline-none border border-zinc-600 rounded-lg p-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition text-sm"
                                    value={name} 
                                    onChange={(e) => setName(e.target.value)} 
                                    required 
                                />
                            </div>

                            {/* Date of Birth Field */}
                            <div className="w-full">
                                <label className="text-zinc-300 text-sm font-medium block mb-2">Date of Birth <span className="text-red-500">*</span></label>
                                <input
                                    type="date"
                                    placeholder="DOB"
                                    className="w-full bg-zinc-700 text-white placeholder:text-zinc-400 outline-none border border-zinc-600 rounded-lg p-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition text-sm"
                                    value={dob}
                                    onChange={(e) => setDob(e.target.value)}
                                    max={new Date().toISOString().split('T')[0]}
                                    required
                                />
                            </div>

                            {/* Bio Field */}
                            <div className="w-full relative">
                                <label className="text-zinc-300 text-sm font-medium block mb-2">Bio</label>
                                <textarea
                                    type="text"
                                    placeholder="Tell us about yourself (max 200 characters)"
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value.slice(0, 200))}
                                    className="w-full h-24 sm:h-28 bg-zinc-700 text-white placeholder:text-zinc-400 outline-none border border-zinc-600 rounded-lg p-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition text-sm resize-none"
                                    maxLength="200"
                                />
                                <div className="absolute bottom-3 right-3 text-xs text-zinc-400">
                                    {bio.length}/200
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button 
                                type="submit" 
                                disabled={isSubmitting} 
                                className="w-full px-6 py-3 rounded-lg mt-2 shadow-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-blue-600 transition text-sm sm:text-base"
                            >
                                {isSubmitting ? "Saving..." : "Save Profile"}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
            </div>
        </main>
    );
}

export default Profilesetup;
