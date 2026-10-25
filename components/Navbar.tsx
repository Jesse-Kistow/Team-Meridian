"use client";

import Link from "next/link";
import { Show, UserButton, useUser } from "@clerk/nextjs";

export default function Navbar() {
  const { user } = useUser();
  const role = user?.publicMetadata?.role;

  return (
    <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4">
      <nav className="flex items-center gap-6 text-sm font-semibold text-neutral-800">
        <Link href="/" className="font-extrabold text-violet-600">
          EVENT AGGREGATOR
        </Link>
        {role === "ATTENDEE" && <Link href="/my-tickets">My Tickets</Link>}
        {role === "ORGANIZER" && <Link href="/organizer/events">My Events</Link>}
      </nav>

      <div className="flex items-center gap-4 text-sm font-semibold">
        <Show when="signed-out">
          <Link href="/sign-in" className="text-neutral-800">
            Log in
          </Link>
          <Link href="/sign-up" className="rounded-lg bg-violet-600 px-4 py-2 font-bold text-white hover:bg-violet-700">
            Sign up
          </Link>
        </Show>
        <Show when="signed-in">
          <UserButton />
        </Show>
      </div>
    </header>
  );
}