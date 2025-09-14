'use client'
import Navbar from "@/components/Navbar"
import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
export default function Signup() {
  const router = useRouter();
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const validateFields = () => {
    const emailRegex = /^(\d{2}[a-z]+[0-9]+@charusat\.edu\.in|[a-z]+(\.[a-z]+)?@charusat\.ac\.in)$/i;
    if (!email || !password || !confirmPassword) {
      setMessage("Warning: Please fill in all fields.");
      return false;
    }
    if (password !== confirmPassword) {
      setMessage("Warning: Passwords do not match.");
      return false;
    }
    if (!emailRegex.test(email)) {
      setMessage("Warning: Please use a valid Charusat email.");
      return false;
    }

    return true;
  };

  const handleSignup = async () => {
    if (!validateFields()) return;
    setLoading(true);
    setMessage(null);

    try {
      // Faculty check: emails ending in @charusat.ac.in
      const isFaculty = email.toLowerCase().endsWith("@charusat.ac.in");

      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          name: email.split("@")[0],
          isFaculty, // ✅ send to backend
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(`Error: ${data.error || "Something went wrong"}`);
      } else {
        setMessage("Success: Account created.");
        localStorage.setItem("authToken", data.token);
        setTimeout(() => router.push("/auth/login"), 1000);
      }
    } catch (err) {
      console.error("Signup failed:", err);
      setMessage("Error: Could not connect to server.");
    } finally {
      setLoading(false);
    }
  };


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

            {/* Button */}
            <button
              onClick={handleSignup}
              disabled={loading}
              className="mt-3 w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 flex justify-center items-center"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                "Sign Up"
              )}
            </button>
              {/* Link to Signup */}
            <p className="mt-4 text-center text-sm text-gray-600">
              Already Have an account?{" "}
              <Link href="/auth/login" className="text-blue-600 font-medium hover:underline">
                Login
              </Link>
            </p>


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
