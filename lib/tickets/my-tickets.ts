// Turns the signed-in user's Ticket rows into the My Tickets props (US-602, US-604).
// Pure, so it's unit tested. Tickets bought together (same order and tier) show as one card.
import type { PastTicket, UpcomingTicket } from "../../components/tickets/types";
import { DISPLAY_TIME_ZONE, dayLabel, fmt, shortTicketCode, timeLabel } from "./display";

export type TicketRecord = {
  id: string;
  status: "VALID" | "USED" | "CANCELLED";
  orderId: string;
  order: { status: "PENDING" | "PAID" | "FAILED" | "CANCELLED" | "REFUNDED" };
  tier: { id: string; name: string };
  event: {
    id: string;
    title: string;
    venue: string;
    city: string;
    imageUrl: string | null;
    startsAt: Date;
    endsAt: Date;
    status: "DRAFT" | "PUBLISHED" | "CANCELLED";
  };
};

type Group = { first: TicketRecord; tickets: TicketRecord[] };

function groupTickets(tickets: TicketRecord[]): Group[] {
  const groups = new Map<string, Group>();
  for (const t of tickets) {
    const key = `${t.orderId}:${t.tier.id}`;
    const g = groups.get(key);
    if (g) g.tickets.push(t);
    else groups.set(key, { first: t, tickets: [t] });
  }
  return [...groups.values()];
}

/** A ticket no longer gets you in if it was cancelled, refunded, or the event was cancelled. */
const isCancelled = (t: TicketRecord) =>
  t.status === "CANCELLED" || t.order.status === "REFUNDED" || t.event.status === "CANCELLED";

export function pastOutcome(tickets: TicketRecord[]): PastTicket["outcome"] {
  if (tickets.some((t) => t.status === "USED")) return "ATTENDED";
  if (tickets.every(isCancelled)) return "CANCELLED";
  return "MISSED";
}

const plural = (n: number) => `${n} ticket${n === 1 ? "" : "s"}`;

export function toMyTickets(
  tickets: TicketRecord[],
  holderName: string,
  now: Date,
  timeZone = DISPLAY_TIME_ZONE,
): { upcoming: UpcomingTicket[]; past: PastTicket[] } {
  const groups = groupTickets(tickets);
  const upcomingGroups = groups.filter((g) => g.first.event.endsAt > now);
  const pastGroups = groups.filter((g) => g.first.event.endsAt <= now);

  const upcoming = upcomingGroups
    .sort((a, b) => a.first.event.startsAt.getTime() - b.first.event.startsAt.getTime())
    .map(({ first, tickets }): UpcomingTicket => {
      const e = first.event;
      return {
        id: first.id,
        eventTitle: e.title,
        dateLabel: `${dayLabel(e.startsAt, timeZone)} · ${timeLabel(e.startsAt, timeZone)}`,
        locationLabel: `${e.venue}, ${e.city}`,
        imageUrl: e.imageUrl,
        status: tickets.every(isCancelled) ? "CANCELLED" : "CONFIRMED",
        ticketCount: tickets.length,
        tierName: first.tier.name,
        holderName,
        ticketCode: shortTicketCode(first.id),
        href: `/my-tickets/${first.id}`,
      };
    });

  const past = pastGroups
    .sort((a, b) => b.first.event.startsAt.getTime() - a.first.event.startsAt.getTime())
    .map(({ first, tickets }): PastTicket => {
      const e = first.event;
      return {
        id: first.id,
        month: fmt(e.startsAt, { month: "short" }, timeZone).toUpperCase(),
        day: fmt(e.startsAt, { day: "2-digit" }, timeZone),
        title: e.title,
        locationLabel: `${e.venue}, ${e.city}`,
        dateLabel: dayLabel(e.startsAt, timeZone),
        timeLabel: `${timeLabel(e.startsAt, timeZone)} · ${plural(tickets.length)}`,
        outcome: pastOutcome(tickets),
        href: `/my-tickets/${first.id}`,
      };
    });

  return { upcoming, past };
}
