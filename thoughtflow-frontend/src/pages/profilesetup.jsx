import { useState, useEffect } from "react";

function Profilesetup() {
    const [userData, setUserData] = useState(null);
    const [profilePicture, setProfilePicture] = useState(null);
    const [bio, setBio] = useState("");
    const [dob, setDob] = useState(""); 
    const [name, setName] = useState("");
    function handleSubmit(event) {
        event.preventDefault();
        const token = localStorage.getItem("token");
        if (!token) return;

        const formData = new FormData();
        if (profilePicture) formData.append("profilePicture", profilePicture);
        formData.append("bio", bio);

        fetch("http://localhost:5000/api/user", {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`
            },
            body: formData
        })
        .then(response => response.json())
        .then(data => console.log("Profile updated:", data))
        .catch(error => console.error("Error:", error));
    }

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            fetch("http://localhost:5000/api/user", {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            })
            .then(response => response.json())
            .then(data => {
                setUserData(data);
                setBio(data.bio || "");
            })
            .catch(error => console.error("Error:", error));
        }
    }, []);

    return (
        <main className="fixed bgiblack w-full h-screen flex flex-row items-center justify-center">
            <div className="flex items-center justify-around bg-black w-full h-screen">
                <img src="src/assets/logo.svg" alt="Logo Image" className="w-[40%] h-[50%] object-cover rounded-lg" />
            </div>

            <div className="bg-black w-full h-screen items-center justify-center p-4">
                <div className="flex bg-zinc-600 w-[80%] h-[80%] mt-20  p-5 rounded-2xl justify-center items-center">
                    <div className="flex flex-col w-full h-full p-5 justify-between rounded-lg bg-zinc-800 shadow-lg  items-center">
                        <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full h-full items-center justify-between">
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
                                <input type="text" placeholder="Name" className="bg-transparent text-white placeholder:text-zinc-500 outline-none"  value={name} onChange={(e) => setName(e.target.value)} /></div>
                            <div className=" mt-10" >
                                <input
                                  type="date"
                                    placeholder="DOB"
                                    className=" bg-transparent text-white  border-zinc-500 outline-none "
                                    value={dob}
                                    onChange={(e) => setDob(e.target.value)}
                                    max={new Date().toISOString().split('T')[0]}
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
                            <button type="submit" className="px-6 py-2 bg-zinc-600 text-white rounded-lg">Save Profile</button>
                        </form>
                    </div>
                </div>
            </div>
        </main>
    );
}

export default Profilesetup;