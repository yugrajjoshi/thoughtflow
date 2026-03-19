import  React , { useState } from 'react'; 
import { Eye, EyeOff } from "lucide-react";

function AuthPage() {

    function handleSubmit(event) {
        event.preventDefault();
        // Handle form submission logic here
       fetch("http://127.0.0.1:8000/api/login/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            username: username,
            password: password })
    })
    .then(response => response.json())

    .then(data => {
        if(data.token) {
            // Store the token in local storage or state management
            localStorage.setItem("token", data.token);
            // Redirect to the dashboard or home page
            window.location.href = "/home";
        }
    })

    }

    const [showPassword,setShowPassword] = useState(false);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

  return (
  <div className="flex items-center justify-center h-screen bg-black">

    <div className=" flex items-center justify-around bg-black rounded-lg -mt-10 w-full h-screen">
        <div className="bg-black rounded-lg justify-center items-center shadow-lg pt-3 w-full max-w-md h-[80%]">
             
          <div className= "bg-white flex flex-col items-center justify-center rounded-2xl p-4 w-full " >
             <div className=" border w-full  rounded-2xl p-10 m-5" >
                 <h3 className= "text-2xl font-bold text-black text-shadow-black " >WELCOME!</h3>
                  <br />
                  <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
                    <label htmlFor="username" className="text-black text-left ">Username</label>
                    <input
                      id="username"
                      type="text"
                      placeholder="Username"
                      className="w-full rounded-2xl p-3 bg-black text-white placeholder:text-gray-400 border border-black focus:outline-none focus:ring-2 focus:ring-black"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                    <div className="flex flex-col">
  <label htmlFor="password" className="text-black text-left">Password</label>

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
  <a href="#" className="text-blue-500 hover:underline text-sm self-end mt-1">
    Forgot password?
  </a>
</div>
                    <button type="submit" className="bg-gray-500 hover:bg-gray-700 transition duration-200 text-white font-bold py-2 px-4 rounded-2xl">
                        Login
                    </button>
                  </form>
                  <br />
                  Dont have an account ? <a href="#" className="text-blue-500 hover:underline">Sign up</a>
                  <button className="bg-black hover:bg-gray-800 transition duration-200 rounded-4xl w-[70%] mt-7  text-white font-bold  p-4 ">
                        Sign in with Google
                    </button>
                   </div>
               </div> 
        </div>
    </div>
  </div>
      
      );
}
export default AuthPage;