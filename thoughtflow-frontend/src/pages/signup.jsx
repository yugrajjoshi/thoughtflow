import React, { useState } from "react";

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
        <main className="bg-black w-full min-h-screen flex flex-col items-center justify-center p-4">
            <img
              src="src/assets/logo.svg"
              alt="Logo Image"
              className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 object-cover rounded-lg mb-6"
            />
            <div className="bg-white border border-zinc-500 w-full max-w-md rounded-2xl p-6 sm:p-8">   
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8">Create an account</h1>
                    {errorMessage && (
                        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
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
                            <label htmlFor="username" className="text-black text-left text-sm font-medium block mb-1">
                                Username
                            </label>
                            <input
                                id="username"
                                type="text"
                                placeholder="Enter username"
                                className="w-full rounded-lg p-3 bg-black text-white placeholder:text-gray-400 border border-black focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
                        
                        <div>
                            <label htmlFor="email" className="text-black text-left text-sm font-medium block mb-1">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                placeholder="Enter email"
                                className="w-full rounded-lg p-3 bg-black text-white placeholder:text-gray-400 border border-black focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="text-black text-left text-sm font-medium block mb-1">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                placeholder="Enter password"
                                className="w-full rounded-lg p-3 bg-black text-white placeholder:text-gray-400 border border-black focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="text-black text-left text-sm font-medium block mb-1">
                                Confirm Password
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                placeholder="Confirm password"
                                className="w-full rounded-lg p-3 bg-black text-white placeholder:text-gray-400 border border-black focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-gray-500 hover:bg-gray-700 transition duration-200 text-white font-bold py-3 px-4 rounded-lg text-sm sm:text-base mt-2"
                        >
                            Sign up
                        </button>
                    </form>

                    <p className="text-center text-black text-sm mt-4">
                        Already have an account? <a href="/" className="text-blue-500 hover:underline font-semibold">Login</a>
                    </p>
                </div>
            </div>
        </main>
    );
}

export default Signup;
