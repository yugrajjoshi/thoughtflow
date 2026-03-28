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
        setInlineAlert({ type: "error", message: "Please login first." });
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
                setInlineAlert({ type: "error", message: "Session expired. Please login again." });
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
            <main className="bg-black w-full h-screen flex items-center justify-center text-zinc-300">
                Checking session...
            </main>
        );
    }

    return (
        <main className="fixed bg-black w-full h-screen flex flex-row items-center justify-center">
            <div className="flex items-center justify-around bg-black w-full h-screen">
                <img src="src/assets/logo.svg" alt="Logo Image" className="w-[40%] h-[50%] object-cover rounded-lg" />
            </div>

            <div className="bg-black w-full h-screen items-center justify-center p-4">
                <div className="flex bg-zinc-600 w-[80%] h-[80%] mt-20  p-5 rounded-2xl justify-center items-center">
                    <div className="flex flex-col w-full h-full p-5 justify-between rounded-lg bg-zinc-800 shadow-lg  items-center">
                        <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full h-full items-center justify-between">
                            {inlineAlert.message ? (
                                <div
                                    className={`w-full rounded-lg px-4 py-2 text-sm ${inlineAlert.type === "error" ? "bg-red-900/40 text-red-200 border border-red-500/40" : "bg-green-900/40 text-green-200 border border-green-500/40"}`}
                                >
                                    {inlineAlert.message}
                                </div>
                            ) : null}
                            <div className="flex flex-row gap-5 w-full h-[80%] ">
                            <div  >
                            <label className=" ml-5 shadow-lg self-start w-50 h-50 rounded-full  border-black border-2  m-5 cursor-pointer overflow-hidden flex items-center justify-center">
                               <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setProfilePicture(e.target.files[0])}
                                className="mt-10 hidden"
                                />
                                {profilePicture ? (
                                    <img src={URL.createObjectURL(profilePicture)} alt="Profile Preview" className="w-full h-full object-cover rounded-full" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-500">No image selected</div>
                                )}
                            </label>
                            </div>
                            
                            <div className="flex flex-col w-full h-[75%] mt-5 rounded-2xl bg-linear-to-br from-zinc-800 to-zinc-400 justify-center shadow-2xl p-5 text-bold " >
                            <div className="self-start  border-b"> 
                                <label className="text-zinc-400"></label>
                                <input type="text" placeholder="Name" className="bg-transparent text-white placeholder:text-zinc-500 outline-none"  value={name} onChange={(e) => setName(e.target.value)} required /><span className="text-black">*</span></div>
                            <div className=" mt-10" >
                                <label className="text-zinc-400"><span className="text-black">*</span> Date of Birth</label>
                                <input
                                  type="date"
                                    placeholder="DOB"
                                    className=" bg-transparent text-zinc-400  border-zinc-500 outline-none "
                                    value={dob}
                                    onChange={(e) => setDob(e.target.value)}
                                    max={new Date().toISOString().split('T')[0]}
                                    required
                                />
                            </div>
                            </div>
                            </div>
                     <div className="relative flex flex-row w-full h-[50%] bg-linear-to-br from-zinc-800 to-zinc-400 rounded-2xl justify-start items-start shadow-2xl text-bold p-5 overflow-hidden" >
                                <textarea
                                    type="text"
                                    placeholder="Bio"
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value.slice(0, 200))}
                                    className="w-full h-full placeholder:text-zinc-500 bg-transparent outline-none text-white resize-none wrap-break-word whitespace-normal"
                                />
                                <div className="absolute bottom-2 right-2 text-xs text-zinc-800">
                                    {bio.length}/200
                                </div>
                         </div>
                            <button type="submit" disabled={isSubmitting} className="px-6 py-2 rounded-4xl shadow-2xl bg-zinc-600 text-white disabled:opacity-60 disabled:cursor-not-allowed">{isSubmitting ? "Saving..." : "Save Profile"}</button>
                        </form>
                    </div>
                </div>
            </div>
        </main>
    );
}

export default Profilesetup;