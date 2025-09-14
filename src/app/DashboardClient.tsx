"use client"
import Navbar from "@/components/Navbar";
import { CirclePlus, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

type QA = { id: string; question: string; answer?: string; asked_by: string; pdf_uploaded_by?: string };

type DashboardClientProps = {
  email: string;
  isFaculty: boolean;
};


export default function DashboardClient({ isFaculty }: DashboardClientProps) {
  // --- Push Notification Setup ---
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    // Only prompt faculty/uploaders for push subscription
    if (!isFaculty) return;
    // Register service worker
    navigator.serviceWorker.register('/service-worker.js').then(async (reg) => {
      // Check for existing subscription
      const sub = await reg.pushManager.getSubscription();
      if (!sub) {
        // Prompt for permission
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          // Subscribe
          const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
          if (!vapidPublicKey) return;
          const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
          const newSub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: convertedVapidKey
          });
          // Send subscription to backend
          await fetch('/api/push-subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subscription: newSub })
          });
        }
      }
    });
    // Helper to convert VAPID key
  function urlBase64ToUint8Array(base64String: string) {
      const padding = '='.repeat((4 - base64String.length % 4) % 4);
      const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      return outputArray;
    }
  }, [isFaculty]);
  const [pdfs, setPdfs] = useState<{ key: string; url: string; name: string }[]>([]);
  const [selectedPdf, setSelectedPdf] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [query, setQuery] = useState("");
  const [qaList, setQaList] = useState<QA[]>([]);
  const [questionLoading, setQuestionLoading] = useState(false);
  const [answerInputs, setAnswerInputs] = useState<{ [id: string]: string }>({});
  const [answerLoading, setAnswerLoading] = useState<{ [id: string]: boolean }>({});
  // Helper to get current user id (from JWT in cookie)
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    fetch("/api/userid").then(res => res.json()).then(data => setUserId(data.id)).catch(() => setUserId(null));
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const fetchPdfs = async () => {
      const { data, error } = await supabase.storage.from("pdf").list("pdf");
      if (error) return;
      if (data) {
        const files = data
          .filter((item) => item.name.endsWith(".pdf"))
          .map((item) => {
            const key = `pdf/${item.name}`;
            const apiUrl = `/api/pdf/${encodeURIComponent("pdf")}/${encodeURIComponent(item.name)}`;
            // Add name property for display
            return { key, url: apiUrl, name: item.name };
          });
        setPdfs(files);
      }
    };
    fetchPdfs();
  }, []);

  // Fetch Q&A for selected PDF
  useEffect(() => {
    if (!selectedKey) {
      setQaList([]);
      return;
    }
    setQuestionLoading(true);
    fetch(`/api/queries?pdf=${encodeURIComponent(selectedKey)}`)
      .then(res => res.json())
      .then(data => setQaList(data.queries || []))
      .catch(() => setQaList([]))
      .finally(() => setQuestionLoading(false));
  }, [selectedKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !selectedKey) return;
    setQuestionLoading(true);
    try {
      const res = await fetch('/api/queries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: query, pdf: selectedKey }),
      });
      const data = await res.json();
      if (res.ok && data.query) {
        setQaList(prev => [...prev, data.query]);
        setQuery("");
      }
    } finally {
      setQuestionLoading(false);
    }
  };

  const handleSelectPdf = async (apiUrl: string, key: string) => {
    setLoadingPdf(true);
    setSelectedPdf(null);
    setSelectedKey(key);
    try {
      const res = await fetch(apiUrl);
      const { url: signedUrl } = await res.json();
      setSelectedPdf(
        `https://docs.google.com/viewer?url=${encodeURIComponent(signedUrl)}&embedded=true`
      );
    } catch (err) {
      console.error("Error fetching signed URL", err);
    }
  };

  return (
    <div>
      <Navbar />
      {isFaculty && (
        <div className="w-full flex justify-end mt-6 pr-8">
          <button
            className="bg-blue-100 text-blue-600 px-4 py-2 rounded-full shadow hover:bg-blue-200 transition flex items-center gap-2"
            onClick={() => window.location.href = '/upload'}
          >
            <CirclePlus size={20} className="" />
            Upload
          </button>
        </div>
      )}
      <div className="flex px-5 items-center flex-col w-full">
          <div className="w-full shadow-lg my-8 mx-4 flex flex-col md:flex-row h-auto md:h-[560px] border rounded-lg overflow-hidden">
            {/* Sidebar with PDF list */}
            <div className="w-full md:w-1/6 border-b md:border-b-0 md:border-r overflow-y-auto bg-gray-50">
              <h2 className="text-lg font-bold p-4 border-b">Select PDF</h2>
              <ul className="space-y-1 p-2">
                {pdfs.length === 0 && <li className="p-2">No PDFs found.</li>}
                {pdfs.map((pdf) => (
                  <li key={pdf.key}>
                    <button
                      className={`block w-full text-left px-3 py-2 rounded hover:bg-gray-200 ${
                        selectedKey === pdf.key
                          ? "bg-blue-100 font-bold text-blue-700"
                          : "text-gray-700"
                      }`}
                      onClick={() => handleSelectPdf(pdf.url, pdf.key)}
                    >
                      {pdf.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            {/* PDF viewer */}
            <div className="flex-1 md:flex-[2] border-b md:border-b-0 md:border-r min-h-[400px] relative">
              {selectedPdf ? (
                <>
                  {loadingPdf && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10">
                      <span className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></span>
                    </div>
                  )}
                  <iframe
                    src={selectedPdf}
                    width="100%"
                    height="800px"
                    className="border-0"
                    onLoad={() => setLoadingPdf(false)}
                  />
                </>
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
                {questionLoading ? (
                  <div className="flex items-center justify-center h-20">
                    <span className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></span>
                  </div>
                ) : qaList.length === 0 ? (
                  <p className="text-gray-400 italic">No questions asked yet.</p>
                ) : qaList.map((qa) => (
                  <div key={qa.id} className="border rounded p-3 bg-gray-50">
                    <p className="font-semibold text-gray-800">Q: {qa.question}</p>
                    {qa.answer ? (
                      <p className="mt-2 text-gray-700">A: {qa.answer}</p>
                    ) : (isFaculty && userId && qa.pdf_uploaded_by === userId) ? (
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          setAnswerLoading((prev) => ({ ...prev, [qa.id]: true }));
                          try {
                            const res = await fetch(`/api/queries`, {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ id: qa.id, answer: answerInputs[qa.id] }),
                            });
                            const data = await res.json();
                            if (res.ok && data.query) {
                              setQaList((prev) => prev.map(q => q.id === qa.id ? { ...q, answer: data.query.answer } : q));
                              setAnswerInputs((prev) => ({ ...prev, [qa.id]: "" }));
                            }
                          } finally {
                            setAnswerLoading((prev) => ({ ...prev, [qa.id]: false }));
                          }
                        }}
                        className="flex gap-2 mt-2"
                      >
                        <input
                          type="text"
                          value={answerInputs[qa.id] || ""}
                          onChange={e => setAnswerInputs(prev => ({ ...prev, [qa.id]: e.target.value }))}
                          placeholder="Type answer..."
                          className="border rounded px-2 py-1 text-sm flex-1"
                          disabled={answerLoading[qa.id]}
                        />
                        <button
                          type="submit"
                          className="rounded-full bg-blue-100 hover:bg-blue-200 p-2 flex items-center justify-center"
                          disabled={answerLoading[qa.id] || !(answerInputs[qa.id] && answerInputs[qa.id].trim())}
                          title="Send answer"
                        >
                          <Send size={18} className="text-blue-900" />
                        </button>
                      </form>
                    ) : (
                      <p className="mt-2 text-gray-700">A: This query has not been answered yet.</p>
                    )}
                  </div>
                ))}
              </div>
              <form onSubmit={handleSubmit} className="p-4 border-t flex gap-2">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask a question..."
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
  );
}
