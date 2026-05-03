import React, { useState } from 'react';
import { Eye, EyeOff } from "lucide-react";

// Simple modal for password reset
function PasswordResetModal({ open, onClose }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [resetUrl, setResetUrl] = useState("");
  const [sent, setSent] = useState(false);

  if (!open) return null;

  const submit = async (e) => {
    e.preventDefault();
    try {
      const resp = await fetch('http://127.0.0.1:8000/api/password-reset/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await resp.json();
      if (data.reset_url) {
        setResetUrl(data.reset_url);
        setMessage('Reset link generated (development).');
        setSent(true);
      } else {
        setMessage(data.detail || 'If that email exists, a reset link was sent.');
        setSent(true);
      }
    } catch (err) {
      setMessage('Request failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <h3 className="text-lg font-semibold mb-2">Reset Password</h3>
        {!sent ? (
          <form onSubmit={submit} className="flex flex-col gap-2">
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="p-2 border rounded" />
            <div className="flex items-center gap-2">
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Send</button>
              <button type="button" onClick={onClose} className="px-4 py-2 border rounded">Close</button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-sm">{message}</p>
            {resetUrl ? (
              <div className="flex items-center gap-2">
                <input readOnly value={resetUrl} className="flex-1 p-2 bg-black text-white rounded" />
                <button
                  type="button"
                  onClick={() => { navigator.clipboard.writeText(resetUrl); }}
                  className="px-3 py-2 border rounded"
                >
                  Copy
                </button>
              </div>
            ) : null}
            <div className="flex items-center gap-2">
              <button type="button" onClick={onClose} className="px-4 py-2 border rounded">Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AuthPage() {
  function handleSubmit(event) {
    event.preventDefault();
    // Handle form submission logic here
    fetch("http://127.0.0.1:8000/api/login/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: username,
        password: password,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.token) {
          // Store the token in local storage or state management
          localStorage.setItem("token", data.token);
          // Redirect to the dashboard or home page
          window.location.href = "/home";
        }
        else{ console.error("Login failed: ", data); }
      });
  }

  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [resetOpen, setResetOpen] = useState(false);

  return (
    <div className="flex items-center justify-center h-screen bg-black">
      <div className=" flex items-center justify-around bg-black rounded-lg -mt-10 w-full h-screen">
        <img
          src="src/assets/logo.svg"
          alt="Logo Image"
          className="w-[30%] h-[50%] object-cover rounded-lg"
        />
        <div className="bg-black rounded-lg justify-center items-center shadow-lg pt-3 w-full max-w-md h-[80%]">
          <div className="bg-white flex flex-col items-center justify-center rounded-2xl p-4 w-full ">
            <div className=" border w-full  rounded-2xl p-10 m-5">
              <h3 className="text-2xl font-bold text-black text-shadow-black ">WELCOME!</h3>
              <br />
              <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
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
                <div className="flex flex-col">
                  <label htmlFor="password" className="text-black text-left">
                    Password
                  </label>

                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      className="rounded-2xl p-3 w-full bg-black text-white placeholder:text-gray-400 border border-black focus:outline-none focus:ring-2 focus:ring-black pr-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />

                    {/* Eye Button */}
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>

                  {/* Forgot Password */}
                  <button type="button" onClick={() => setResetOpen(true)} className="text-blue-500 hover:underline text-sm self-end mt-1">
                    Forgot password?
                  </button>
                </div>
                <button
                  type="submit"
                  className="bg-gray-500 hover:bg-gray-700 transition duration-200 text-white font-bold py-2 px-4 rounded-2xl"
                >
                  Login
                </button>
              </form>
              <br />
              <div className="text-center">
                Dont have an account ? <a href="/signup" className="text-blue-500 hover:underline">Sign up</a>
              </div>
              <button
                className="bg-black hover:bg-gray-800 transition duration-200 rounded-4xl w-[70%] mt-7 text-white font-bold p-4 mx-auto block"
                onClick={() => { window.location.href = 'http://127.0.0.1:8000/api/auth/google/redirect/'; }}
                type="button"
              >
                Sign in with Google
              </button>
            </div>
          </div>
        </div>
      </div>
      <PasswordResetModal open={resetOpen} onClose={() => setResetOpen(false)} />
    </div>
  );
}

export default AuthPage;