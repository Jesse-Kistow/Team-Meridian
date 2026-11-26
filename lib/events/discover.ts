// Pure helpers for the public Discover page (/events). No Prisma or Next imports, so they're unit tested.
import type { CategoryPill, EventCardData } from "../../components/discover/types";

// Same zone as lib/events/public.ts: events don't store a time zone yet.
const DISPLAY_TIME_ZONE = "America/New_York";

/** "SAT, OCT 24 · 2 PM" (minutes only when not on the hour). */
export function cardDateLabel(d: Date, timeZone = DISPLAY_TIME_ZONE): string {
  const day = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone });
  const minutes = Number(d.toLocaleString("en-US", { minute: "numeric", timeZone }));
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", ...(minutes ? { minute: "2-digit" } : {}), timeZone });
  return `${day} · ${time}`.toUpperCase();
}

/** Category key used in ?category=. Categories are free text on events, so compare lower-cased. */
export const categoryKey = (category: string) => category.trim().toLowerCase();

/** One pill per distinct category, in first-seen order, labelled as the organizer typed it. */
export function categoryPills(categories: string[]): CategoryPill[] {
  const seen = new Map<string, string>();
  for (const c of categories) {
    const key = categoryKey(c);
    if (key && !seen.has(key)) seen.set(key, c.trim());
  }
  return [...seen].map(([key, label]) => ({ key, label }));
}

export type DiscoverRecord = {
  id: string;
  title: string;
  venue: string;
  city: string;
  imageUrl: string | null;
  startsAt: Date;
  tiers: { priceCents: number }[];
};

export const fromPriceCents = (tiers: { priceCents: number }[]) =>
  tiers.length ? Math.min(...tiers.map((t) => t.priceCents)) : null;

export function toEventCard(e: DiscoverRecord, timeZone = DISPLAY_TIME_ZONE): EventCardData {
  return {
    id: e.id,
    title: e.title,
    dateLabel: cardDateLabel(e.startsAt, timeZone),
    locationLabel: e.venue,
    fromPriceCents: fromPriceCents(e.tiers),
    imageUrl: e.imageUrl,
  };
}

/** Reads a single string from a search param that may be missing or repeated. */
export function firstParam(v: string | string[] | undefined, maxLength = 100): string {
  const s = Array.isArray(v) ? v[0] : v;
  return (s ?? "").trim().slice(0, maxLength).trim();
}
