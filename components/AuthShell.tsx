import Image from "next/image";
import Link from "next/link";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";

const inter = Inter({ subsets: ["latin"] });

type AuthShellProps = {
  children: ReactNode;
  altHref?: string;
  altLabel?: string;
};

export default function AuthShell({ children, altHref, altLabel }: AuthShellProps) {
  return (
    <div className={`${inter.className} flex min-h-screen bg-stone-100`}>
      {/* Left: photo panel (hidden on small screens) */}
      <div className="relative hidden w-[45%] flex-col justify-end gap-6 overflow-hidden bg-indigo-950 p-16 lg:flex">
        <Image
          src="/auth-hero.jpg"
          alt=""
          fill
          priority
          sizes="45vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(15,23,42,0.1),rgba(15,23,42,0.95))]" />
        <div className="relative text-xs font-extrabold text-white">
          GOOD MUSIC. BETTER COMPANY.
        </div>
        <h2 className="relative text-6xl font-black leading-[1.05] text-white">
          Your next great night awaits.
        </h2>
        <p className="relative text-base text-white">
          Discover it. Be there. Make a memory.
        </p>
      </div>

      {/* Right: top bar, then the slot for Clerk's form */}
      <div className="flex flex-1 flex-col gap-6 px-6 py-12 sm:px-12 xl:px-24">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xs font-extrabold text-violet-600">
            EVENT AGGREGATOR
          </Link>
          {altHref && altLabel && (
            <Link href={altHref} className="text-xs font-bold text-violet-600">
              {altLabel} ↗
            </Link>
          )}
        </div>
        <div className="flex flex-1 items-center justify-center">{children}</div>
      </div>
    </div>
  );
}