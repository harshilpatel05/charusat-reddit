'use client'
// Removed unused NavigationMenu imports
import Image from "next/image"
export default function Navbar() {
    // Logout handler
    const handleLogout = async () => {
        await fetch('/api/logout', { method: 'POST' });
        window.location.reload();
    };
    return (
        <div className="p-2 shadow-md flex flex-row justify-between items-center">
           <div>
               <Image className="p-2" src ="/charusatlogo.png" height={300} width={300} alt="Logo"></Image>
           </div>
           <div className="flex flex-col items-center justify-center text-2xl p-2 font-bold">
               <p>Cheddit</p>
           </div>
           <button
             onClick={handleLogout}
             className="bg-red-100 text-red-600 px-4 py-2 rounded-full shadow hover:bg-red-200 transition ml-4"
           >
             Logout
           </button>
        </div>
    )
}