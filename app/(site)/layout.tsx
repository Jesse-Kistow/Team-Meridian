import type { ReactNode } from "react";
import { Suspense } from "react";
import Navbar from "@/components/Navbar";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Suspense fallback={<div className="h-20 border-b border-zinc-200 bg-stone-100" />}>
            <Navbar />
        </Suspense>
      <main>{children}</main>
    </>
  );
}