'use client'
import Navbar from "@/components/Navbar"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"   // 👈 import Link

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) {
      setMessage("Warning: Please fill in all fields.");
      return;
    }

    setLoading(true)
    setMessage(null)

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage(`Error: ${data.error || "Login failed"}`)
      } else {
        setMessage("Success: Logged in.")
        localStorage.setItem("authToken", data.token)
        localStorage.setItem("user", JSON.stringify(data.user))
        setTimeout(() => router.push("/"), 1000);
      }
    } catch (err) {
      console.error("Login failed:", err)
      setMessage("Error: Could not connect to server.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Navbar />
      <div className="min-h-screen flex flex-col">
        <div className="flex flex-1 justify-center items-center px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-md bg-white shadow-lg rounded-lg p-6 border">
            <h1 className="text-xl font-bold mb-6 text-center">Login</h1>

            {/* Email */}
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full border rounded px-3 py-2 mb-4 text-sm focus:outline-none focus:ring focus:ring-blue-200"
            />

            {/* Password */}
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full border rounded px-3 py-2 mb-4 text-sm focus:outline-none focus:ring focus:ring-blue-200"
            />

            {/* Button */}
            <button
              onClick={handleLogin}
              disabled={loading}
              className="mt-3 w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 flex justify-center items-center"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                "Login"
              )}
            </button>

            {/* Link to Signup */}
            <p className="mt-4 text-center text-sm text-gray-600">
              Don’t have an account?{" "}
              <Link href="/auth/signup" className="text-blue-600 font-medium hover:underline">
                Sign up
              </Link>
            </p>

            {/* Message */}
            {message && (
              <p className="mt-4 text-center text-sm bg-blue-200 p-2 rounded-2xl border-2 border-blue-500 text-blue-800 font-bold">
                {message}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
