'use client'
import Image from "next/image";

type NavbarProps = {
    showLogout?: boolean;
};

export default function Navbar({ showLogout }: NavbarProps) {
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
                             <p>Project Name</p>
                     </div>
                     {showLogout && (
                         <button
                             onClick={handleLogout}
                             className="bg-red-100 text-red-600 px-4 py-2 rounded-full shadow hover:bg-red-200 transition ml-4"
                         >
                             Logout
                         </button>
                     )}
                </div>
        )
}