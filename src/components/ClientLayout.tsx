"use client";
import PageTransitionLoader from "@/components/PageTransitionLoader";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return <PageTransitionLoader>{children}</PageTransitionLoader>;
}
