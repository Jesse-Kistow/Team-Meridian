"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { completeOnboarding } from "./_actions";

type Role = "ATTENDEE" | "ORGANIZER";

function TicketIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
      <path d="M13 5v2" />
      <path d="M13 11v2" />
      <path d="M13 17v2" />
    </svg>
  );
}

function CalendarPlusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <path d="M21 13V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8" />
      <path d="M3 10h18" />
      <path d="M16 19h6" />
      <path d="M19 16v6" />
    </svg>
  );
}

const OPTIONS: { role: Role; title: string; description: string; icon: ReactNode }[] = [
  {
    role: "ATTENDEE",
    title: "Attendee",
    description: "Discover events and buy tickets.",
    icon: <TicketIcon />,
  },
  {
    role: "ORGANIZER",
    title: "Organizer",
    description: "Create events, sell tickets and manage attendance.",
    icon: <CalendarPlusIcon />,
  },
];

export default function OnboardingForm() {
  const router = useRouter();
  const { user } = useUser();
  const [role, setRole] = useState<Role>("ATTENDEE");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleContinue() {
    setError(null);
    startTransition(async () => {
      const result = await completeOnboarding(role);
      if (!result.ok) {
        setError(result.error ?? "Something went wrong.");
        return;
      }
      await user?.reload(); // refresh the session so the proxy sees the new role
      router.push("/");
    });
  }

  return (
    <div className="w-full max-w-lg">
      <h1 className="text-4xl font-extrabold text-neutral-800">
        How will you use Event Aggregator?
      </h1>
      <p className="mt-2 text-base text-zinc-500">
        Choose your account type to get started.
      </p>

      <div role="radiogroup" aria-label="Account type" className="mt-8 flex flex-col gap-4">
        {OPTIONS.map((option) => {
          const selected = role === option.role;
          return (
            <button
              key={option.role}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setRole(option.role)}
              className={`flex min-h-28 w-full items-center gap-5 rounded-2xl border-2 p-6 text-left transition ${
                selected
                  ? "border-violet-600 bg-violet-100"
                  : "border-zinc-200 bg-white hover:border-violet-300"
              }`}
            >
              <span className="text-violet-600">{option.icon}</span>
              <span className="flex-1">
                <span className="block text-lg font-bold text-neutral-800">
                  {option.title}
                </span>
                <span className="mt-1 block text-sm text-zinc-500">
                  {option.description}
                </span>
              </span>
              <span
                className={`size-6 shrink-0 rounded-full bg-white ${
                  selected ? "border-[7px] border-violet-600" : "border-2 border-zinc-200"
                }`}
              />
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={handleContinue}
        disabled={pending}
        className="mt-8 h-14 w-full rounded-xl bg-violet-600 text-base font-bold text-white hover:bg-violet-700 disabled:opacity-60"
      >
        {pending ? "Saving..." : "Continue →"}
      </button>

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}