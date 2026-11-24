"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { CheckCircleIcon, QrIcon, SearchIcon, SettingsIcon, TrophyIcon, XCircleIcon } from "./OrganizerIcons";
import { initials, percent } from "./format";
import type { EventSummary, ScanResult } from "./types";

type Props = {
  event: EventSummary;
  /** Tickets sold for the event, and how many are already checked in. */
  sold: number;
  checkedIn: number;
  /** The latest scan outcome. null = nothing scanned yet. */
  result: ScanResult | null;
  /** Put the real camera scanner here (Sprint 7). Without it a placeholder frame shows. */
  scanner?: ReactNode;
  /** Clears the result and re-arms the scanner. */
  onScanNext?: () => void;
  /** Manual lookup by attendee name, email or ticket code. */
  onManualSearch?: (query: string) => void | Promise<void>;
  backHref?: string;
  settingsHref?: string;
  locationLabel?: string;
};

const card = "rounded-[20px] border border-[#E5E1E8] bg-white p-6 sm:p-7";

function ResultCard({ result }: { result: ScanResult | null }) {
  if (!result) {
    return (
      <section className={`${card} text-center`}>
        <p className="text-lg font-extrabold text-[#211E29]">Ready to scan</p>
        <p className="mt-1 text-[13px] text-[#79747F]">Results appear here after each scan.</p>
      </section>
    );
  }

  if (result.kind === "success") {
    return (
      <section aria-live="polite" className="flex flex-col gap-6 rounded-3xl border border-[#BDDFCF] bg-white p-6 sm:p-[30px]">
        <div className="flex items-center gap-4">
          <div className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-full bg-[#E5F3EC] text-[#23745B]">
            <CheckCircleIcon width={28} height={28} />
          </div>
          <div>
            <p className="text-[26px] font-extrabold leading-tight text-[#23745B] sm:text-[28px]">You&apos;re in, {result.name.split(" ")[0]}.</p>
            <p className="text-[13px] text-[#79747F]">Successfully admitted at {result.timeLabel}</p>
          </div>
        </div>
        <hr className="border-[#E5E1E8]" />
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#EEE7FF] text-base font-bold text-[#713EFF]">
            {initials(result.name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[23px] font-extrabold text-[#211E29]">{result.name}</p>
            <p className="text-[13px] text-[#79747F]">
              {result.tierName} · {result.quantity} {result.quantity === 1 ? "person" : "people"}
            </p>
            <p className="text-xs text-[#79747F]">Ticket {result.ticketCode}</p>
          </div>
          <span className="rounded-full bg-[#E5F3EC] px-3 py-[7px] text-[11px] font-bold text-[#23745B]">VALID</span>
        </div>
        {result.badgeUnlocked && (
          <div className="flex items-center gap-3 rounded-xl bg-[#EEE7FF] p-[18px] text-[#713EFF]">
            <TrophyIcon width={24} height={24} className="shrink-0" />
            <p className="flex-1 text-[13px] font-bold">
              {result.badgeUnlocked} badge unlocked for {result.name.split(" ")[0]}
            </p>
          </div>
        )}
      </section>
    );
  }

  // Failure states: tell the door staff exactly why.
  const copy =
    result.kind === "already-used"
      ? { title: "Already checked in", body: `${result.name} was admitted at ${result.usedAtLabel}.`, code: result.ticketCode }
      : result.kind === "wrong-event"
        ? { title: "Wrong event", body: "This ticket is for a different event.", code: result.ticketCode }
        : { title: "Invalid ticket", body: "This code isn't a ticket we recognise.", code: result.ticketCode };

  return (
    <section role="alert" className="flex items-center gap-4 rounded-3xl border border-[#F2B8B5] bg-white p-6 sm:p-[30px]">
      <div className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-full bg-[#FBE9E7] text-[#B3261E]">
        <XCircleIcon width={28} height={28} />
      </div>
      <div>
        <p className="text-[26px] font-extrabold leading-tight text-[#B3261E] sm:text-[28px]">{copy.title}</p>
        <p className="text-[13px] text-[#79747F]">{copy.body}</p>
        {copy.code && <p className="text-xs text-[#79747F]">Ticket {copy.code}</p>}
      </div>
    </section>
  );
}

export default function CheckInScreen({
  event,
  sold,
  checkedIn,
  result,
  scanner,
  onScanNext,
  onManualSearch,
  backHref = "/organizer/events",
  settingsHref,
  locationLabel = "Main entrance",
}: Props) {
  const [query, setQuery] = useState("");
  const admittedPct = percent(checkedIn, sold);
  const scanText =
    result?.kind === "success" ? "QR detected · Verification complete" : result ? "QR detected · Check the result" : "Point the camera at a ticket QR code";

  return (
    <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-7 px-4 py-8 sm:px-8 lg:px-16">
      <Link href={backHref} className="text-[13px] text-[#79747F] hover:text-[#211E29]">
        ← Ticket &amp; event management / {event.title} / Door check-in
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-6">
        <div className="flex flex-col gap-2.5">
          <p className="text-[11px] font-extrabold tracking-wide text-[#713EFF]">ORGANIZER WORKFLOW / {event.isLive ? "LIVE EVENT" : "CHECK-IN"}</p>
          <h1 className="text-3xl font-extrabold text-[#211E29] sm:text-4xl">{event.title} check-in</h1>
        </div>
        {settingsHref && (
          <Link href={settingsHref} className="flex items-center gap-2.5 text-[13px] text-[#211E29] hover:underline">
            <SettingsIcon className="text-[#79747F]" /> Scanner settings
          </Link>
        )}
      </div>

      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xl font-extrabold text-[#211E29]">{event.title}</p>
          <p className="text-[13px] text-[#79747F]">
            {event.dateLabel} · {locationLabel}
          </p>
        </div>
        {event.isLive && <span className="rounded-full bg-[#E5F3EC] px-3 py-[7px] text-[11px] font-bold text-[#23745B]">LIVE</span>}
      </div>

      <div className="grid gap-9 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
        {/* Scanner side */}
        <div className="flex flex-col gap-[22px]">
          <div className="relative flex min-h-[320px] flex-col items-center justify-center gap-6 overflow-hidden rounded-3xl bg-[#251A3D] p-6 sm:h-[425px]">
            {scanner ?? (
              <div className="relative flex h-[220px] w-[232px] items-center justify-center rounded-[28px] border-2 border-[#B598FF]">
                <QrIcon width={64} height={64} className="text-white" />
                <span className="absolute left-5 right-5 top-1/2 h-0.5 bg-[#B598FF]" />
              </div>
            )}
            <p className="text-[13px] text-white">{scanText}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={onScanNext}
              className="h-[50px] rounded-xl bg-[#713EFF] text-sm font-bold text-white hover:bg-[#5F2FE6]"
            >
              Scan next ticket
            </button>
            <button
              type="button"
              onClick={() => document.getElementById("manual-search")?.focus()}
              className="h-[50px] rounded-xl bg-[#EEE7FF] text-sm font-bold text-[#713EFF] hover:bg-[#E2D6FF]"
            >
              Find attendee manually
            </button>
          </div>

          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              if (query.trim()) void onManualSearch?.(query.trim());
            }}
            className="flex h-[52px] items-center gap-3 rounded-xl border border-[#E5E1E8] bg-white px-4 focus-within:border-[#713EFF] focus-within:ring-2 focus-within:ring-[#713EFF]/20"
          >
            <SearchIcon className="shrink-0 text-[#79747F]" />
            <input
              id="manual-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by attendee name or ticket number"
              className="flex-1 bg-transparent text-sm text-[#211E29] outline-none placeholder:text-[#79747F]"
            />
          </form>
        </div>

        {/* Result side */}
        <div className="flex flex-col gap-6">
          <ResultCard result={result} />
          <section className={`${card} flex flex-col gap-[22px]`}>
            <div className="flex items-start justify-between">
              <p className="text-sm text-[#79747F]">Guests checked in</p>
              <QrIcon className="text-[#713EFF]" />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-4xl font-extrabold text-[#211E29]">
                {checkedIn} / {sold}
              </p>
              <span className="rounded-full bg-[#EEE7FF] px-3 py-[7px] text-[11px] font-bold text-[#713EFF]">{admittedPct}% admitted</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[#E5E1E8]">
              <div className="h-full rounded-full bg-[#713EFF]" style={{ width: `${admittedPct}%` }} />
            </div>
            <p className="text-[13px] text-[#79747F]">{Math.max(0, sold - checkedIn)} guests still to arrive</p>
          </section>
        </div>
      </div>
    </div>
  );
}
