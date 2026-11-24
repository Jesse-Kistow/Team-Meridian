"use client";

import { useState } from "react";
import Link from "next/link";
import type { PastTicket, UpcomingTicket } from "./types";

type Props = {
  upcoming: UpcomingTicket[]; // soonest first
  past: PastTicket[]; // most recent first
  initialTab?: "upcoming" | "past";
  discoverHref?: string;
  helpHref?: string;
};

const outcomeStyle: Record<PastTicket["outcome"], { label: string; cls: string }> = {
  ATTENDED: { label: "Attended", cls: "bg-[#F3F1F5] text-[#79747F]" },
  MISSED: { label: "Not used", cls: "bg-[#FBF3E3] text-[#8A5A00]" },
  CANCELLED: { label: "Cancelled", cls: "bg-[#FBECEF] text-[#A53E50]" },
};

export default function MyTickets({ upcoming, past, initialTab = "upcoming", discoverHref = "/events", helpHref = "mailto:support@example.com" }: Props) {
  const [tab, setTab] = useState<"upcoming" | "past">(initialTab);

  const tabBtn = (key: "upcoming" | "past", label: string, count: number) => {
    const active = tab === key;
    return (
      <button
        type="button"
        role="tab"
        aria-selected={active}
        onClick={() => setTab(key)}
        className={`flex items-center gap-2.5 rounded-xl px-[18px] py-[11px] text-sm ${active ? "bg-[#EEE7FF] font-bold text-[#713EFF]" : "font-medium text-[#79747F] hover:bg-[#F7F5F1]"}`}
      >
        {label}
        <span className={`rounded-full px-[7px] py-px text-[11px] font-bold ${active ? "bg-[#713EFF] text-white" : "bg-[#EAE6E0] text-[#79747F]"}`}>{count}</span>
      </button>
    );
  };

  return (
    <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-7 px-4 py-10 sm:px-8 lg:px-16">
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-bold tracking-wide text-[#713EFF]">YOUR PLANS, ALL IN ONE PLACE</p>
          <h1 className="text-4xl font-extrabold text-[#211E29] sm:text-[44px] sm:leading-[52px]">My tickets</h1>
          <p className="text-base text-[#79747F]">Good nights ahead. Great memories behind you.</p>
        </div>
        <Link href={discoverHref} className="rounded-xl border border-[#E5E1E8] bg-white px-5 py-[13px] text-sm font-bold text-[#211E29] hover:bg-[#F7F5F1]">
          Discover events ↗
        </Link>
      </div>

      <div role="tablist" className="flex gap-2 border-b border-[#E5E1E8] pb-[18px]">
        {tabBtn("upcoming", "Upcoming", upcoming.length)}
        {tabBtn("past", "Past", past.length)}
      </div>

      {tab === "upcoming" ? (
        <>
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <p className="text-sm font-bold text-[#211E29]">
                {upcoming.length} upcoming {upcoming.length === 1 ? "event" : "events"}
              </p>
              <p className="text-[13px] text-[#79747F]">Soonest first</p>
            </div>

            {upcoming.length === 0 && (
              <div className="rounded-[20px] border border-[#E5E1E8] bg-white px-6 py-14 text-center">
                <p className="text-lg font-extrabold text-[#211E29]">No upcoming tickets yet</p>
                <p className="mt-1 text-sm text-[#79747F]">When you buy tickets, they&apos;ll show up here with your QR code.</p>
                <Link href={discoverHref} className="mt-5 inline-flex h-[46px] items-center rounded-xl bg-[#713EFF] px-6 text-sm font-bold text-white hover:bg-[#5F2FE6]">
                  Explore events ↗
                </Link>
              </div>
            )}

            {upcoming.map((t) => (
              <article key={t.id} className="flex flex-col gap-[22px] rounded-[20px] border border-[#E5E1E8] bg-white px-6 pb-5 pt-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-[26px]">
                  {t.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={t.imageUrl} alt="" className="h-[158px] w-full shrink-0 rounded-xl object-cover sm:w-60" />
                  ) : (
                    <div className="h-[158px] w-full shrink-0 rounded-xl bg-gradient-to-br from-[#EEE7FF] to-[#B598FF] sm:w-60" />
                  )}
                  <div className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
                    <span className={`rounded-full px-2.5 py-[5px] text-[11px] font-bold ${t.status === "CONFIRMED" ? "bg-[#EAF5EE] text-[#26704B]" : "bg-[#FBECEF] text-[#A53E50]"}`}>{t.status}</span>
                    <h2 className="break-words text-[28px] font-extrabold leading-tight text-[#211E29]">{t.eventTitle}</h2>
                    <p className="text-[15px] font-medium text-[#211E29]">{t.dateLabel}</p>
                    <p className="text-sm text-[#79747F]">{t.locationLabel}</p>
                  </div>
                  <div className="flex flex-col items-center gap-2.5">
                    {t.status === "CONFIRMED" ? (
                      <>
                        <Link href={t.href} className="rounded-xl bg-[#713EFF] px-9 py-3.5 text-sm font-bold text-white hover:bg-[#5F2FE6]">
                          View ticket →
                        </Link>
                        <p className="text-xs text-[#79747F]">Your QR code is ready</p>
                      </>
                    ) : (
                      <p className="text-xs text-[#79747F]">This ticket was cancelled</p>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap justify-between gap-2 border-t border-[#E5E1E8] pt-[18px] text-[13px] text-[#79747F]">
                  <p>
                    {t.ticketCount} {t.ticketCount === 1 ? "ticket" : "tickets"} · {t.tierName} · {t.holderName}
                  </p>
                  <p className="font-medium">Ticket {t.ticketCode}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="flex flex-col gap-[18px]">
            <h2 className="text-[17px] font-bold text-[#211E29]">Before you go</h2>
            <div className="grid gap-5 md:grid-cols-2">
              <div className="flex flex-col items-start gap-2 rounded-2xl border border-[#E5E1E8] bg-white px-6 py-[22px]">
                <p className="text-base font-bold text-[#211E29]">Your ticket, ready at the door</p>
                <p className="text-[13px] text-[#79747F]">Open your ticket to find your QR code and add it to your wallet.</p>
                {upcoming[0] && upcoming[0].status === "CONFIRMED" && (
                  <Link href={upcoming[0].href} className="text-[13px] font-bold text-[#713EFF] hover:underline">
                    View ticket →
                  </Link>
                )}
              </div>
              <div className="flex flex-col items-start gap-2 rounded-2xl border border-[#E5E1E8] bg-white px-6 py-[22px]">
                <p className="text-base font-bold text-[#211E29]">A little help with your plans?</p>
                <p className="text-[13px] text-[#79747F]">For ticket questions or event updates, we&apos;re here to help.</p>
                <a href={helpHref} className="text-[13px] font-bold text-[#713EFF] hover:underline">
                  Help &amp; support ↗
                </a>
              </div>
            </div>

            <div className="flex flex-col items-start gap-6 rounded-[20px] bg-[#EEE7FF] p-7 md:flex-row md:items-center md:gap-8">
              <div className="hidden h-[116px] w-[156px] shrink-0 rounded-xl bg-gradient-to-br from-[#B598FF] to-[#713EFF] md:block" aria-hidden />
              <div className="flex flex-1 flex-col gap-1.5">
                <p className="text-[11px] font-bold text-[#713EFF]">KEEP THE GOOD PLANS COMING</p>
                <p className="text-2xl font-extrabold text-[#211E29]">Your next thing is out there.</p>
                <p className="text-sm text-[#79747F]">Live music, art, and a little adventure. Find what moves you.</p>
              </div>
              <Link href={discoverHref} className="rounded-xl bg-[#713EFF] px-[22px] py-3.5 text-sm font-bold text-white hover:bg-[#5F2FE6]">
                Explore events ↗
              </Link>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between pb-1">
              <p className="text-sm font-bold text-[#211E29]">
                {past.length} past {past.length === 1 ? "event" : "events"}
              </p>
              <p className="text-[13px] text-[#79747F]">Most recent first</p>
            </div>

            {past.length === 0 && <p className="rounded-2xl border border-[#E5E1E8] bg-white px-6 py-12 text-center text-sm text-[#79747F]">Events you&apos;ve attended will appear here.</p>}

            {past.map((p) => {
              const o = outcomeStyle[p.outcome];
              return (
                <div key={p.id} className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl border border-[#E5E1E8] bg-white px-6 py-5">
                  <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-[#F4F1EC]">
                    <span className="text-[10px] font-bold text-[#79747F]">{p.month}</span>
                    <span className="text-[25px] font-extrabold leading-[30px] text-[#211E29]">{p.day}</span>
                  </div>
                  <div className="min-w-[160px] flex-1">
                    <p className="text-[19px] font-bold text-[#211E29]">{p.title}</p>
                    <p className="text-[13px] text-[#79747F]">{p.locationLabel}</p>
                  </div>
                  <div className="w-[190px]">
                    <p className="text-[13px] font-medium text-[#211E29]">{p.dateLabel}</p>
                    <p className="text-xs text-[#79747F]">{p.timeLabel}</p>
                  </div>
                  <div className="w-[116px]">
                    <span className={`inline-block rounded-full px-2.5 py-[5px] text-[11px] font-bold ${o.cls}`}>{o.label}</span>
                  </div>
                  <Link href={p.href} className="w-[110px] text-[13px] font-bold text-[#713EFF] hover:underline">
                    View details →
                  </Link>
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap justify-between gap-2 pt-2 text-[13px]">
            <p className="text-[#79747F]">Good nights, kept in one place. Your past tickets stay here.</p>
            <a href={helpHref} className="font-bold text-[#713EFF] hover:underline">
              Need help with a ticket? ↗
            </a>
          </div>
        </>
      )}
    </div>
  );
}
