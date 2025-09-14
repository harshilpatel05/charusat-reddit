import React from "react";

export default function PageLoader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70">
      <span className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></span>
    </div>
  );
}
