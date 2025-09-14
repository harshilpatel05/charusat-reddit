"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import PageLoader from "@/components/PageLoader";

export default function PageTransitionLoader({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(() => setLoading(false), 700); // Show loader for at least 700ms
    return () => clearTimeout(timeout);
  }, [pathname]);

  return (
    <>
      {loading && <PageLoader />}
      {children}
    </>
  );
}
