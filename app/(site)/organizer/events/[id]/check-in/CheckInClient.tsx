"use client";

import { useState, useTransition } from "react";
import CheckInScreen from "@/components/organizer/CheckInScreen";
import type { EventSummary, ScanResult } from "@/components/organizer/types";
import type { AttendeeMatch } from "@/lib/checkin/check-in";
import QrScanner from "./QrScanner";
import { checkInTicket, checkInTicketById, searchAttendees, type CheckInResponse } from "./_actions";

type Props = { event: EventSummary; sold: number; checkedIn: number };

const statusLabel: Record<AttendeeMatch["status"], string> = { VALID: "Not checked in", USED: "Checked in", CANCELLED: "Cancelled" };

export default function CheckInClient({ event, sold, checkedIn: initialCheckedIn }: Props) {
  const [result, setResult] = useState<ScanResult | null>(null);
  const [checkedIn, setCheckedIn] = useState(initialCheckedIn);
  const [matches, setMatches] = useState<AttendeeMatch[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handle = (response: CheckInResponse) => {
    if (!response.ok) {
      setError(response.error);
      return;
    }
    setError(null);
    setResult(response.result);
    setCheckedIn(response.checkedIn);
  };

  const onScan = (code: string) =>
    startTransition(async () => {
      try {
        handle(await checkInTicket(code, event.id));
      } catch {
        setError("Check-in failed. Check your connection and scan again.");
      }
    });

  const admitById = (ticketId: string) =>
    startTransition(async () => {
      try {
        handle(await checkInTicketById(ticketId, event.id));
        setMatches(null);
      } catch {
        setError("Check-in failed. Check your connection and try again.");
      }
    });

  const onManualSearch = (query: string) =>
    startTransition(async () => {
      try {
        const response = await searchAttendees(query, event.id);
        if (!response.ok) setError(response.error);
        else setMatches(response.matches);
      } catch {
        setError("Search failed. Check your connection and try again.");
      }
    });

  return (
    <>
      <CheckInScreen
        event={event}
        sold={sold}
        checkedIn={checkedIn}
        result={result}
        // The scanner stays paused while a result is on screen, so one ticket isn't read twice
        scanner={<QrScanner onScan={onScan} paused={pending || result !== null} />}
        onScanNext={() => {
          setResult(null);
          setError(null);
        }}
        onManualSearch={onManualSearch}
        backHref={`/organizer/events/${event.id}`}
        locationLabel={event.locationLabel}
      />

      {(error || matches) && (
        <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-4 px-4 pb-10 sm:px-8 lg:px-16">
          {error && (
            <p role="alert" className="rounded-xl border border-[#F2B8B5] bg-[#FBE9E7] p-4 text-sm text-[#8C1D18]">
              {error}
            </p>
          )}
          {matches && (
            <section aria-label="Search results" className="rounded-[20px] border border-[#E5E1E8] bg-white p-6 sm:p-7">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-bold text-[#211E29]">
                  {matches.length === 0 ? "No tickets match that search." : `${matches.length} matching ticket${matches.length === 1 ? "" : "s"}`}
                </p>
                <button type="button" onClick={() => setMatches(null)} className="text-[13px] text-[#79747F] hover:text-[#211E29]">
                  Close
                </button>
              </div>
              <ul className="flex flex-col divide-y divide-[#E5E1E8]">
                {matches.map((m) => (
                  <li key={m.ticketId} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-[#211E29]">{m.name}</p>
                      <p className="truncate text-xs text-[#79747F]">
                        {m.email} · {m.tierName} · Ticket {m.ticketCode} · {statusLabel[m.status]}
                      </p>
                    </div>
                    {m.status === "VALID" && (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => admitById(m.ticketId)}
                        className="rounded-lg bg-[#713EFF] px-4 py-2 text-[13px] font-bold text-white hover:bg-[#5F2FE6] disabled:opacity-60"
                      >
                        Check in
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </>
  );
}
