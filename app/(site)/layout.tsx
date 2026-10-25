import type { ReactNode } from "react";
import { Suspense } from "react";
import Navbar from "@/components/Navbar";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Suspense>
        <Navbar />
      </Suspense>
      <main>{children}</main>
    </>
  );
}