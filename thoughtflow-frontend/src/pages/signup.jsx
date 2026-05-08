import React, { useState } from "react";
import Logo from "../components/Logo";

function Signup(){

   const handleSubmit = (e) => {
        e.preventDefault();
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
            console.log("Signup successful: ", data);
            if (data.token) {
                localStorage.setItem("token", data.token);
            }
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
    const [errorMessage, setErrorMessage] = useState("");

    return(
        <main className="bg-black w-full min-h-screen flex items-center justify-center">
          <div className="flex flex-col md:flex-row items-center justify-center w-full">
                        <Logo className="w-24 h-24 md:w-1/2 md:h-screen object-cover rounded-lg md:rounded-none shrink-0 mb-4 md:mb-0" alt="Logo Image" />
            <div className="w-full md:w-1/2 flex items-center justify-center p-4 md:p-8">
            <div className="bg-zinc-700 border border-zinc-600 w-full max-w-md rounded-2xl p-6 sm:p-6">
                <div className="bg-zinc-800 rounded-lg p-6">
                    <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8 text-white">Create an account</h1>
                    {errorMessage && (
                        <div className="mb-4 p-3 bg-red-900/40 border border-red-500/40 text-red-200 rounded text-sm">
                            {errorMessage}
                        </div>
                    )}
                    <form className="flex flex-col gap-4 w-full" onSubmit={ (e) => {
                        e.preventDefault();
                        if (password !== confirmPassword) {
                            setErrorMessage("Passwords do not match");
                            return;
                        }
                        setErrorMessage("");
                        handleSubmit(e);
                    }}>
                        <div>
                            <label htmlFor="username" className="text-zinc-300 text-left text-sm font-medium block mb-1">
                                Username
                            </label>
                            <input
                                id="username"
                                type="text"
                                placeholder="Enter username"
                                className="w-full rounded-lg p-3 bg-zinc-700 text-white placeholder:text-zinc-400 border border-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
                        
                        <div>
                            <label htmlFor="email" className="text-zinc-300 text-left text-sm font-medium block mb-1">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                placeholder="Enter email"
                                className="w-full rounded-lg p-3 bg-zinc-700 text-white placeholder:text-zinc-400 border border-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="text-zinc-300 text-left text-sm font-medium block mb-1">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                placeholder="Enter password"
                                className="w-full rounded-lg p-3 bg-zinc-700 text-white placeholder:text-zinc-400 border border-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="text-zinc-300 text-left text-sm font-medium block mb-1">
                                Confirm Password
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                placeholder="Confirm password"
                                className="w-full rounded-lg p-3 bg-zinc-700 text-white placeholder:text-zinc-400 border border-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 transition duration-200 text-white font-bold py-3 px-4 rounded-lg text-sm sm:text-base mt-2"
                        >
                            Sign up
                        </button>
                    </form>

                    <p className="text-center text-zinc-300 text-sm mt-4">
                        Already have an account? <a href="/" className="text-blue-400 hover:underline font-semibold">Login</a>
                    </p>
                </div>
            </div>
            </div>
          </div>
        </main>
    );
}

export default Signup;
