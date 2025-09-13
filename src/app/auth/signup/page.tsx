'use client'
import Navbar from "@/components/Navbar"
import { useState } from "react"

export default function Signup() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSignup = () => {
    if (!email || !password || !confirmPassword) {
      setMessage("⚠️ Please fill in all fields.")
      return
    }
    if (password !== confirmPassword) {
      setMessage("⚠️ Passwords do not match.")
      return
    }

    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setMessage(`✅ Account created for ${email}`)
      setEmail("")
      setPassword("")
      setConfirmPassword("")
    }, 1500) // simulate signup
  }

  return (
    <div>
      <Navbar />
      <div className="min-h-screen flex flex-col">
        <div className="flex flex-1 justify-center items-center px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-md bg-white shadow-lg rounded-lg p-6 border">
            <h1 className="text-xl font-bold mb-6 text-center">Sign Up</h1>

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

            {/* Confirm Password */}
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              className="w-full border rounded px-3 py-2 mb-4 text-sm focus:outline-none focus:ring focus:ring-blue-200"
            />

            {/* Submit */}
            <button
              onClick={handleSignup}
              disabled={loading}
              className="mt-3 w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? "Signing up..." : "Sign Up"}
            </button>

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
