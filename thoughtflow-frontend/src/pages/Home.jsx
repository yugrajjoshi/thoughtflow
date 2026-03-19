import React, { useState } from 'react';



function Home() {

  const token = localStorage.getItem("token");
  if(!token){
    window.location.href = "/";
  };
  return (
    <main className="min-h-screen bg-linear-to-br from-slate-50 via-white to-cyan-50 p-6 md:p-10">
     <div> hello home screen </div>
      login successfull
    </main>
  );
}

export default Home;