"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import { useClerk, useUser } from "@clerk/nextjs";
import { initialsOf } from "@/lib/initials";
import {
  BellIcon,
  CalendarIcon,
  CompassIcon,
  TicketIcon,
  UserIcon,
} from "@/components/icons";

type NavLink = {
  href: string;
  label: string;
  Icon: ComponentType<{ className?: string }>;
};

// "Discover" points home until the events page exists (Sprint 4)
const DISCOVER: NavLink = { href: "/", label: "Discover", Icon: CompassIcon };
const PROFILE: NavLink = { href: "/profile", label: "Profile", Icon: UserIcon };

const ATTENDEE_LINKS: NavLink[] = [
  DISCOVER,
  { href: "/my-tickets", label: "Tickets", Icon: TicketIcon },
  PROFILE,
];

const ORGANIZER_LINKS: NavLink[] = [
  DISCOVER,
  { href: "/organizer/events", label: "My Events", Icon: CalendarIcon },
  PROFILE,
];


export default function Navbar() {
  const pathname = usePathname();
  const { signOut } = useClerk();
  const { isLoaded, isSignedIn, user } = useUser();

  const role = user?.publicMetadata?.role;
  const links = !isSignedIn
    ? [DISCOVER]
    : role === "ORGANIZER"
      ? ORGANIZER_LINKS
      : ATTENDEE_LINKS;
  const name = user?.fullName ?? user?.primaryEmailAddress?.emailAddress ?? "";
  const roleLabel = role === "ORGANIZER" ? "Organizer account" : "Attendee account";

  function isActive(href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  }

  return (
    <header className="grid h-20 grid-cols-[1fr_auto_1fr] items-center border-b border-zinc-200 bg-stone-100 px-6 lg:px-16">
      {/* Left: logo */}
      <Link href="/" className="flex items-center gap-3 justify-self-start">
        <span className="flex size-9 items-center justify-center rounded-[10px] bg-violet-600 text-white">
          <TicketIcon className="size-5" />
        </span>
        <span className="hidden text-xs font-extrabold text-neutral-800 sm:block">
          EVENT AGGREGATOR
        </span>
      </Link>

      {/* Center: links for this role */}
      <nav className="flex items-center gap-3" aria-label="Main">
        {links.map(({ href, label, Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex h-11 items-center gap-2.5 rounded-xl px-4 text-sm transition-colors md:px-5 ${
                active
                  ? "bg-violet-100 font-bold text-violet-600"
                  : "font-medium text-zinc-500 hover:bg-stone-200"
              }`}
            >
              <Icon className="size-4" />
              <span className="hidden md:inline">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Right: account area */}
      <div className="flex items-center gap-3.5 justify-self-end">
        {!isLoaded ? null : isSignedIn ? (
          <>
            <button
              type="button"
              aria-label="Notifications"
              className="text-zinc-500 hover:text-neutral-800"
            >
              <BellIcon className="size-5" />
            </button>
            <Link href="/profile" className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-full bg-violet-100 text-base font-bold tracking-tight text-violet-600">
                {initialsOf(name)}
              </span>
              <span className="hidden flex-col gap-0.5 lg:flex">
                <span className="text-xs font-bold leading-5 text-neutral-800">{name}</span>
                <span className="text-xs leading-4 text-zinc-500">{roleLabel}</span>
              </span>
            </Link>
            <button
              type="button"
              onClick={() => signOut({ redirectUrl: "/" })}
              className="text-xs font-semibold text-zinc-500 hover:text-neutral-800"
            >
              Log out
            </button>
          </>
        ) : (
          <>
            <Link href="/sign-in" className="text-sm font-semibold text-neutral-800">
              Log in
            </Link>
            <Link
              href="/sign-up"
              className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-violet-700"
            >
              Sign up
            </Link>
          </>
        )}
      </div>
    </header>
  );
}