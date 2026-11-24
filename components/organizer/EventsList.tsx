"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SearchIcon } from "./OrganizerIcons";
import { percent } from "./format";
import type { EventStatus, OrganizerEventRow } from "./types";

type Props = {
  organizerName: string;
  events: OrganizerEventRow[];
  createHref?: string;
  /** Rows link to `${basePath}/${id}` (dashboard) and `${basePath}/${id}/edit`. */
  basePath?: string;
};

type Filter = "ALL" | EventStatus;

const badge: Record<EventStatus, { label: string; cls: string }> = {
  PUBLISHED: { label: "Published", cls: "bg-[#E3F3EB] text-[#23745B]" },
  DRAFT: { label: "Draft", cls: "bg-[#EEE7FF] text-[#713EFF]" },
  CANCELLED: { label: "Cancelled", cls: "bg-[#FBECEF] text-[#A53E50]" },
};

export default function EventsList({ organizerName, events, createHref = "/organizer/events/new", basePath = "/organizer/events" }: Props) {
  const [filter, setFilter] = useState<Filter>("ALL");
  const [query, setQuery] = useState("");

  const counts = useMemo(
    () => ({
      ALL: events.length,
      PUBLISHED: events.filter((e) => e.status === "PUBLISHED").length,
      DRAFT: events.filter((e) => e.status === "DRAFT").length,
      CANCELLED: events.filter((e) => e.status === "CANCELLED").length,
    }),
    [events],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter(
      (e) => (filter === "ALL" || e.status === filter) && (!q || e.title.toLowerCase().includes(q) || e.venueLabel.toLowerCase().includes(q)),
    );
  }, [events, filter, query]);

  const tabs: { key: Filter; label: string }[] = [
    { key: "ALL", label: "All events" },
    { key: "PUBLISHED", label: "Published" },
    { key: "DRAFT", label: "Draft" },
    { key: "CANCELLED", label: "Cancelled" },
  ];

  return (
    <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-7 px-4 py-8 sm:px-8 lg:px-16">
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div className="flex flex-col gap-1.5">
          <p className="text-[11px] font-extrabold tracking-wide text-[#713EFF]">ORGANIZER / {organizerName.toUpperCase()}</p>
          <h1 className="text-3xl font-extrabold text-[#211E29] sm:text-4xl">My Events</h1>
          <p className="text-sm text-[#79747F]">Your events, all in one place. Create, edit and manage every detail.</p>
        </div>
        <Link href={createHref} className="flex h-[50px] items-center rounded-xl bg-[#713EFF] px-6 text-sm font-bold text-white hover:bg-[#5F2FE6]">
          Create an event +
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-4 rounded-2xl border border-[#E5E1E8] bg-white px-6 py-5">
        <div className="min-w-[220px] flex-1">
          <p className="text-base font-bold text-[#211E29]">{organizerName}</p>
          <p className="text-[13px] text-[#79747F]">Only events created by your organizer account appear here.</p>
        </div>
        {[
          { n: counts.ALL, label: "Total events", color: "text-[#211E29]" },
          { n: counts.PUBLISHED, label: "Published", color: "text-[#23745B]" },
          { n: counts.DRAFT, label: "Draft", color: "text-[#713EFF]" },
          { n: counts.CANCELLED, label: "Cancelled", color: "text-[#A53E50]" },
        ].map((s) => (
          <div key={s.label} className="w-[100px]">
            <p className={`text-2xl font-extrabold ${s.color}`}>{s.n}</p>
            <p className="text-xs font-medium text-[#79747F]">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#E5E1E8] bg-white">
        <div className="flex flex-wrap items-center gap-2 border-b border-[#E5E1E8] px-6 py-5">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setFilter(t.key)}
              aria-pressed={filter === t.key}
              className={`rounded-lg px-3.5 py-2.5 text-[13px] ${filter === t.key ? "bg-[#EEE7FF] font-bold text-[#713EFF]" : "font-medium text-[#79747F] hover:bg-[#F7F5F1]"}`}
            >
              {t.label} <span className="ml-1">{counts[t.key]}</span>
            </button>
          ))}
          <div className="ml-auto flex h-10 w-full items-center gap-2 rounded-lg border border-[#E5E1E8] px-3.5 focus-within:border-[#713EFF] sm:w-[236px]">
            <SearchIcon width={16} height={16} className="text-[#79747F]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your events…"
              aria-label="Search your events"
              className="w-full bg-transparent text-[13px] text-[#211E29] outline-none placeholder:text-[#79747F]"
            />
          </div>
        </div>

        <div className="hidden grid-cols-[minmax(0,2.1fr)_1.1fr_0.9fr_0.9fr_minmax(0,2fr)] gap-4 border-b border-[#E5E1E8] bg-[#FCFBFD] px-6 py-3.5 text-[11px] font-semibold text-[#79747F] lg:grid">
          <span>EVENT</span>
          <span>DATE &amp; TIME</span>
          <span>STATUS</span>
          <span>TICKETS SOLD</span>
          <span className="text-right">ACTIONS</span>
        </div>

        {visible.length === 0 && (
          <p className="px-6 py-12 text-center text-sm text-[#79747F]">
            {events.length === 0 ? "You haven't created any events yet." : "No events match your filters."}
          </p>
        )}

        {visible.map((e) => {
          const b = badge[e.status];
          const onSale = e.status === "PUBLISHED";
          return (
            <div key={e.id} className="grid gap-4 border-b border-[#E5E1E8] px-6 py-6 lg:grid-cols-[minmax(0,2.1fr)_1.1fr_0.9fr_0.9fr_minmax(0,2fr)] lg:items-center lg:py-[30px]">
              <div className="min-w-0">
                <p className="truncate text-[17px] font-bold text-[#211E29]">{e.title}</p>
                <p className="truncate text-xs text-[#79747F]">{e.venueLabel}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#211E29]">{e.dateLabel}</p>
                <p className="text-xs text-[#79747F]">{e.timeLabel}</p>
              </div>
              <div>
                <span className={`inline-block rounded-full px-[11px] py-1.5 text-xs font-bold ${b.cls}`}>{b.label}</span>
              </div>
              <div>
                <p className="text-sm font-bold text-[#211E29]">{onSale ? `${e.sold} / ${e.capacity}` : "—"}</p>
                <p className="text-xs text-[#79747F]">
                  {onSale ? `${percent(e.sold, e.capacity)}% of capacity` : e.status === "DRAFT" ? "Not on sale" : "Sales closed"}
                </p>
              </div>
              <div className="flex items-center gap-2.5 lg:justify-end">
                <Link href={`${basePath}/${e.id}/edit`} className="rounded-lg border border-[#E5E1E8] px-[22px] py-[11px] text-[13px] font-bold text-[#211E29] hover:bg-[#F7F5F1]">
                  Edit
                </Link>
                <Link href={`${basePath}/${e.id}`} className="flex h-[42px] items-center justify-center rounded-xl bg-[#EEE7FF] px-5 text-sm font-bold text-[#713EFF] hover:bg-[#E2D6FF] lg:w-40">
                  Open dashboard
                </Link>
              </div>
            </div>
          );
        })}

        <div className="flex flex-wrap justify-between gap-2 px-6 py-5 text-xs text-[#79747F]">
          <span>
            {visible.length === events.length ? `Showing all ${events.length} events` : `Showing ${visible.length} of ${events.length} events`}
          </span>
          <span>Created by {organizerName}</span>
        </div>
      </div>
    </div>
  );
}
