'use client'
import Navbar from "@/components/Navbar"
import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"

type QA = { question: string; answer?: string }

export default function Home() {
  const [pdfs, setPdfs] = useState<{ key: string; url: string }[]>([])
  const [selectedPdf, setSelectedPdf] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [qaList, setQaList] = useState<QA[]>([])

  useEffect(() => {
    const supabase = createClient()

    const fetchPdfs = async () => {
      const { data, error } = await supabase.storage.from("pdf").list("pdf")
      if (error) return

      if (data) {
        const files = data
          .filter((item) => item.name.endsWith(".pdf"))
          .map((item) => {
            const key = `pdf/${item.name}`
            const { publicUrl } = supabase.storage.from("pdf").getPublicUrl(key).data
            return { key, url: publicUrl }
          })

        setPdfs(files)
        if (files.length > 0) setSelectedPdf(files[0].url)
      }
    }

    fetchPdfs()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    const newEntry: QA = { question: query }
    setQaList((prev) => [...prev, newEntry])
    setQuery("")
  }

  return (
    <div>
      <Navbar />
      <div className="flex px-5 items-center flex-col w-full">
        <div className="w-full my-8 mx-4 flex flex-col md:flex-row h-auto md:h-[800px] border rounded-lg overflow-hidden">
          {/* Sidebar with PDF list */}
          <div className="w-full md:w-1/6 border-b md:border-b-0 md:border-r overflow-y-auto bg-gray-50">
            <h2 className="text-lg font-bold p-4 border-b">Select PDF</h2>
            <ul className="space-y-1 p-2">
              {pdfs.length === 0 && <li className="p-2">No PDFs found.</li>}
              {pdfs.map((pdf) => (
                <li key={pdf.url}>
                  <button
                    className={`block w-full text-left px-3 py-2 rounded hover:bg-gray-200 ${selectedPdf === pdf.url
                        ? "bg-blue-100 font-bold text-blue-700"
                        : "text-gray-700"
                      }`}
                    onClick={() => setSelectedPdf(pdf.url)}
                  >
                    {pdf.key.slice(4, pdf.key.length - 4)}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* PDF viewer */}
          <div className="flex-1 md:flex-[2] border-b md:border-b-0 md:border-r min-h-[400px]">
            {selectedPdf ? (
              // <iframe
              //   src={selectedPdf}
              //   width="100%"
              //   height="100%"
              //   className="border-0 min-h-[400px] md:h-full"
              // />
              <iframe
                src={`https://docs.google.com/viewer?url=${encodeURIComponent(selectedPdf)}&embedded=true`}
                width="100%"
                height="800px"
                className="border-0"
              />
              

            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Select a PDF to view
              </div>
            )}
          </div>

          {/* Q&A Panel */}
          <div className="w-full md:w-1/4 flex flex-col bg-white border-t md:border-t-0 md:border-l">
            <h2 className="text-lg font-bold p-4 border-b">Q&A on this PDF</h2>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {qaList.length === 0 && (
                <p className="text-gray-400 italic">No questions asked yet.</p>
              )}
              {qaList.map((qa, i) => (
                <div key={i} className="border rounded p-3 bg-gray-50">
                  <p className="font-semibold text-gray-800">Q: {qa.question}</p>
                  <p className="mt-2 text-gray-700">
                    A: {qa.answer ? qa.answer : "This query has not been answered yet."}
                  </p>
                </div>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="p-4 border-t flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask a question about this PDF..."
                className="flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-blue-200"
              />
              <button
                type="submit"
                className="bg-blue-100 text-blue-600 px-5 py-2 rounded-full hover:bg-blue-200 transition"
              >
                Submit
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
