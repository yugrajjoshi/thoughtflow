import React, { useState } from "react";

function Signup(){

   const handleSubmit = (e) => {
        e.preventDefault();
        // Handle form submission logic here
        fetch("http://127.0.0.1:8000/api/register/",{
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, email, password })
        })
        .then(async (response) => {
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data?.error || "Registration failed");
            }
            return data;
        })
        .then((data) => {
            // Handle the response from the API
            console.log("Signup successful: ", data);
            if (data.token) {
                localStorage.setItem("token", data.token);
            }
            // Redirect to the login page or another appropriate page
            window.location.href = "/profilesetup";
        })
        .catch((error) => {
            console.error("Error during registration: ", error);
        });


    };
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");





    return(
        <main className="bg-black w-full h-screen flex felx-row items-center justify-center">
            <div className=" flex items-center justify-around bg-black rounded-lg -mt-10 w-full h-screen">
        <img
          src="src/assets/logo.svg"
          alt="Logo Image"
          className="w-[30%] h-[50%] object-cover rounded-lg"
        /></div>
            <div className=" bg-white border mr-20 border-zinc-500 w-[50%] h-[90%] rounded-2xl  ">   
                <div>
                    <h1 className="text-3xl font-bold text-center mt-10">Create an account</h1>
                    <form className="flex flex-col gap-3 mt-10 w-[70%] mx-auto"  onSubmit={ (e) => {
                        e.preventDefault();
                        if (password === confirmPassword) {
                            handleSubmit(e);
                        } else {
                            console.error("Passwords do not match");
                        }
                    }}>
                        <label htmlFor="username" className="text-black text-left ">
                            Username
                        </label>
                        <input
                            id="username"
                            type="text"
                            placeholder="Username"
                            className="w-full rounded-2xl p-3 bg-black text-white placeholder:text-gray-400 border border-black focus:outline-none focus:ring-2 focus:ring-black"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                        <label htmlFor="email" className="text-black text-left ">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            placeholder="Email"
                            className="w-full rounded-2xl p-3 bg-black text-white placeholder:text-gray-400 border border-black focus:outline-none focus:ring-2 focus:ring-black"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <label htmlFor="password" className="text-black text-left ">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            placeholder="Password"
                            className="w-full rounded-2xl p-3 bg-black text-white placeholder:text-gray-400 border border-black focus:outline-none focus:ring-2 focus:ring-black"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <label htmlFor="confirmPassword" className="text-black text-left ">
                            confirm Password
                        </label>
                        <input
                            id="confirmPassword"
                            type="password"
                            placeholder="Confirm Password"
                            className="w-full rounded-2xl p-3 bg-black text-white placeholder:text-gray-400 border border-black focus:outline-none focus:ring-2 focus:ring-black"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        <button
                            type="submit"
                            className="bg-gray-500 hover:bg-gray-700 transition duration-200 text-white font-bold py-2 px-4 rounded-2xl"
                        >
                            Sign up
                        </button>
                    </form>

                </div>

            </div>
        </main>
    );
}
export default Signup;