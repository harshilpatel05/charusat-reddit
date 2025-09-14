'use client'
// Removed unused NavigationMenu imports
import Image from "next/image"
export default function Navbar() {
    return (
        <div className="p-2 shadow-md flex flex-row justify-between">
           <div>
               <Image className="p-2" src ="/charusatlogo.png" height={300} width={300} alt="Logo"></Image>
           </div>
           <div className="flex flex-col items-center justify-center text-2xl p-2 font-bold">
               <p>Cheddit</p>
           </div>
        </div>
    )
}