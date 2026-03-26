function Profilesetup(){
    return(
        <main className=" fixed bgiblack w-full h-screen flex felx-row items-center justify-center">
           <div className=" flex items-center justify-around bg-black  w-full h-screen">
        <img
          src="src/assets/logo.svg"
          alt="Logo Image"
          className="w-[40%] h-[50%] object-cover rounded-lg"
        /></div>         
             <div className=" bg-black   border-zinc-500 w-full  h-screen  items-center justify-center p-10 ">
                    <div className="flex bg-white  w-[60%] h-[80%] p-5 rounded-lg justify-center items-center ">
                        <div className=" flex w-[90%] h-full border-zinc-500 border m-5  " ></div>
                    </div>

             </div>      
 
        </main>
    );
}
export default Profilesetup;