import { useState, useEffect } from "react";

function Profilesetup() {
    const [userData, setUserData] = useState(null);
    const [profilePicture, setProfilePicture] = useState(null);
    const [bio, setBio] = useState("");
    const [dob, setDob] = useState(""); 
    const [name, setName] = useState("");
   function handleSubmit(event) {
    event.preventDefault();

    // 1️⃣ Get token
    const token = localStorage.getItem("token");
    if (!token) return;

    // 2️⃣ Create FormData
    const formData = new FormData();
       formData.append("name", name);
       formData.append("bio", bio);
       formData.append("dob", dob);

    // 4️⃣ Append file (only if exists)
    if (profilePicture) {
        formData.append("profile_image", profilePicture);
    }

    // 5️⃣ Fetch request
    fetch("http://127.0.0.1:8000/api/profile/update/", {
        method: "PUT",
        headers: {
            "Authorization": `Token ${token}`
        },
        body: formData
    })

    // 6️⃣ Convert response
    .then(response => response.json())

    // 7️⃣ Handle success
    .then(data => {
        // console log
        console.log(data);
        console.log("Profile updated successfully!");
        // redirect to home
        window.location.href = "/home";
    })

    // 8️⃣ Handle error
    .catch(error => {
        console.error(error);
    });
}

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
                            <button type="submit" className="px-6 py-2 rounded-4xl shadow-2xl  bg-zinc-600 text-white ">Save Profile</button>
                        </form>
                    </div>
                </div>
            </div>
        </main>
    );
}

export default Profilesetup;