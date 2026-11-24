import Link from "next/link";
import { CalendarIcon, PinIcon } from "./EventIcons";
import ShareButton from "./ShareButton";
import { formatMoney, initials } from "../organizer/format";

type Props = {
  event: {
    id: string;
    title: string;
    category: string; // shown as the pill, e.g. "Music + Culture"
    tagline?: string | null;
    headline?: string | null; // optional heading above the description
    description: string;
    imageUrl: string | null;
    dateLabel: string; // "Friday, October 23, 2026"
    timeLabel: string; // "7:00 PM – 12:00 AM"
    doorsLabel?: string | null; // "Doors at 6:30 PM"
    venue: string;
    address?: string | null; // falls back to the city
    ageRestriction?: string | null; // "21+"
  };
  organizer: { name: string; verified?: boolean; eventCount?: number };
  /** Lowest tier price in cents, or null if no tiers. */
  fromPriceCents: number | null;
  /** True when every tier is sold out. */
  soldOut?: boolean;
  backHref?: string;
  backLabel?: string;
  /** Where "Get tickets" goes. Defaults to the checkout route. */
  ticketsHref?: string;
};

const card = "rounded-[20px] border border-[#E5E1E8] bg-white p-6 sm:p-7";

export default function EventDetail({ event, organizer, fromPriceCents, soldOut = false, backHref = "/events", backLabel = "Discover", ticketsHref }: Props) {
  const href = ticketsHref ?? `/events/${event.id}/checkout`;
  const canBuy = fromPriceCents !== null && !soldOut;

  return (
    <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-7 px-4 py-8 sm:px-8 lg:px-16">
      <div className="flex items-center justify-between gap-4">
        <Link href={backHref} className="text-[13px] text-[#79747F] hover:text-[#211E29]">
          ← {backLabel} / {event.title}
        </Link>
        <ShareButton title={event.title} />
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-[26px]">
          {event.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={event.imageUrl} alt="" className="h-[260px] w-full rounded-[20px] object-cover sm:h-[420px]" />
          ) : (
            <div className="h-[260px] w-full rounded-[20px] bg-gradient-to-br from-[#EEE7FF] to-[#B598FF] sm:h-[420px]" />
          )}

          <div className="flex flex-col items-start gap-3">
            <span className="rounded-full bg-[#EEE7FF] px-3 py-[7px] text-[11px] font-bold uppercase text-[#713EFF]">{event.category}</span>
            <h1 className="break-words text-4xl font-black uppercase leading-none text-[#211E29] sm:text-6xl">{event.title}</h1>
            {event.tagline && <p className="text-lg text-[#79747F]">{event.tagline}</p>}
          </div>

          <hr className="border-[#E5E1E8]" />

          <div className="flex flex-col gap-2.5">
            {event.headline && <h2 className="text-2xl font-extrabold text-[#211E29]">{event.headline}</h2>}
            <p className="whitespace-pre-line text-base leading-relaxed text-[#79747F]">{event.description}</p>
          </div>
        </div>

        <aside className="flex flex-col gap-6">
          <section className={`${card} flex flex-col gap-[22px]`}>
            <h2 className="text-[22px] font-extrabold text-[#211E29]">{event.title}</h2>

            <div className="flex items-center gap-3.5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EEE7FF] text-[#713EFF]">
                <CalendarIcon />
              </span>
              <div>
                <p className="text-sm font-bold text-[#211E29]">{event.dateLabel}</p>
                <p className="text-xs text-[#79747F]">
                  {event.timeLabel}
                  {event.doorsLabel ? ` · ${event.doorsLabel}` : ""}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EEE7FF] text-[#713EFF]">
                <PinIcon />
              </span>
              <div>
                <p className="text-sm font-bold text-[#211E29]">{event.venue}</p>
                {event.address && <p className="text-xs text-[#79747F]">{event.address}</p>}
              </div>
            </div>

            {event.ageRestriction && (
              <>
                <hr className="border-[#E5E1E8]" />
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-[#79747F]">Age restriction</span>
                  <span className="rounded-full bg-[#EFECE7] px-3 py-[7px] text-[11px] font-bold text-[#79747F]">{event.ageRestriction}</span>
                </div>
              </>
            )}

            <hr className="border-[#E5E1E8]" />
            <div className="flex flex-col gap-4">
              <p className="text-[13px] text-[#79747F]">{soldOut ? "Status" : "Tickets from"}</p>
              <p className="text-4xl font-extrabold text-[#211E29] sm:text-[44px]">
                {fromPriceCents === null ? "Coming soon" : soldOut ? "Sold out" : fromPriceCents === 0 ? "Free" : formatMoney(fromPriceCents)}
              </p>
              {canBuy ? (
                <Link href={href} className="flex h-[50px] items-center justify-center rounded-xl bg-[#713EFF] text-sm font-bold text-white hover:bg-[#5F2FE6]">
                  Get tickets →
                </Link>
              ) : (
                <span aria-disabled className="flex h-[50px] items-center justify-center rounded-xl bg-[#E5E1E8] text-sm font-bold text-[#79747F]">
                  {soldOut ? "Sold out" : "Tickets not on sale yet"}
                </span>
              )}
            </div>
          </section>

          <section className={`${card} flex flex-col gap-[22px]`}>
            <p className="text-xs uppercase text-[#79747F]">Brought to you by</p>
            <div className="flex items-center gap-3.5">
              <span className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-full bg-[#EEE7FF] text-base font-bold text-[#713EFF]">{initials(organizer.name)}</span>
              <div className="min-w-0">
                <p className="truncate text-[15px] font-extrabold text-[#211E29]">{organizer.name}</p>
                <p className="text-xs text-[#79747F]">
                  {[organizer.verified ? "Verified organizer" : null, organizer.eventCount != null ? `${organizer.eventCount} events` : null].filter(Boolean).join(" · ") || "Organizer"}
                </p>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
