'use client'
import Navbar from "@/components/Navbar"
import { useState } from "react"

export default function Upload() {
  const [title, setTitle] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
      setMessage(null)
    }
  }

  const handleUpload = async () => {
    if (!title.trim()) {
      setMessage("Please enter a title for the PDF.")
      return
    }
    if (!file) {
      setMessage("Please select a PDF file first.")
      return
    }
    if (file.type !== "application/pdf") {
      setMessage("Only PDF files are allowed.")
      return
    }
    

    setUploading(true)
    setMessage(null)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("title", title)

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Upload failed")
      }

      setMessage(`File uploaded: "${title}" (${file.name})`)
      setFile(null)
      setTitle("")
    } catch (err: unknown) {
      if (err instanceof Error) {
        setMessage(err.message)
      } else {
        setMessage("Upload failed")
      }
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <Navbar />
      <div className="min-h-screen flex flex-col">
        <div className="flex flex-1 justify-center items-center px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-lg bg-white shadow-lg rounded-lg p-6 border">
            <h1 className="text-xl font-bold mb-6 text-center">
              Upload a PDF
            </h1>

            {/* PDF Title */}
            <label className="block text-sm font-medium text-gray-700 mb-1">
              PDF Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter PDF title..."
              className="w-full border rounded px-3 py-2 mb-4 text-sm focus:outline-none focus:ring focus:ring-blue-200"
            />

            {/* File Picker */}
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Choose PDF File
            </label>
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-700 mb-2
                file:mr-2 file:py-2 file:px-3
                file:rounded-full file:border-0 file:text-sm file:font-semibold
                file:bg-blue-100 file:text-blue-600 hover:file:bg-blue-200"
            />

            {file && (
              <p className="mt-1 text-sm text-gray-600 truncate">
                Selected: <span className="font-medium">{file.name}</span>
              </p>
            )}

            {/* Upload Button */}
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="mt-5 w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {uploading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                "Upload"
              )}
            </button>

            {/* Status Message */}
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
