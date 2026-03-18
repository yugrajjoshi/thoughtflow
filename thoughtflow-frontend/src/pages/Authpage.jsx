import React from 'react';

function AuthPage() {


    function handleSubmit(event) {
        event.preventDefault();
        // Handle form submission logic here
    }

  return( <>
  <body className="flex items-center justify-center min-h-screen bg-black">

    <div className=" flex items-center justify-around bg-black rounded-lg p-8 w-full h-screen">
        <div className="bg-black rounded-lg justify-center items-center shadow-lg pt-3 w-full max-w-md h-[80%]">
             
          <div className= "bg-white flex flex-col items-center justify-center rounded-2xl p-4 w-full h-full" >
             <div className=" border w-full h-full rounded-2xl p-10 m-5" >
                 <h3 className= "text-2xl font-bold text-black text-shadow-black  " >WELCOME !</h3>
                  <br></br>
                  <form className="flex flex-col gap-3 onSubmit={handleSubmit}">
                    <label htmlFor="username" className="text-black text-left ">Username</label>
                    <input id="username" placeholder="Username" className="w-full rounded-2xl p-3 bg-black text-white placeholder:text-gray-400 border border-black focus:outline-none focus:ring-2 focus:ring-black">
                    </input>
                    <label htmlFor="password" className="text-black text-left">Password</label>
                    <input id="password" placeholder="Password" type="password" className=" rounded-2xl p-3 w-full bg-black text-white placeholder:text-gray-400 border border-black focus:outline-none focus:ring-2 focus:ring-black">
                    </input><div className="flex justify-end">
                    <a href="#" className="text-blue-500 hover:underline rounded-4xl w-[40%] ">Forgot password</a>
                     </div>
                    <button type="submit" className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-2xl">
                        Login
                    </button>
                  </form>
                  <br></br>
                  Dont have an account ? <a href="#" className="text-blue-500 hover:underline">Sign up</a>
                  <button className="bg-black hover:bg-gray-700 rounded-4xl w-[70%] mt-7  text-white font-bold  p-4 ">
                        Sign in with Google
                    </button>
                   </div>
               </div> 
        </div>
    </div>
</body>
      
     



  </>
  )
}
export default AuthPage;