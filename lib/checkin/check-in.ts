// Door check-in (US-701 to 706). Server-only: the actions in
// app/(site)/organizer/events/[id]/check-in/_actions.ts call these after checking
// that the signed-in organizer owns the event.
import "server-only";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "../../generated/prisma/client";
import type { ScanResult } from "@/components/organizer/types";
import { shortTicketCode, timeLabel } from "@/lib/tickets/display";
import { shortCodeSuffix } from "./lookup";

export type TicketRef = { code: string } | { ticketId: string };

/** The event if this organizer owns it, else null (missing and not-yours look the same). */
export async function getOwnedEvent(eventId: string, organizerId: string) {
  return prisma.event.findFirst({
    where: { id: eventId, organizerId },
    select: { id: true, title: true, venue: true, imageUrl: true, startsAt: true, endsAt: true, status: true },
  });
}

/** Tickets issued for the event (not cancelled) and how many are checked in. */
export async function getCheckInCounts(eventId: string) {
  const [sold, checkedIn] = await Promise.all([
    prisma.ticket.count({ where: { eventId, status: { not: "CANCELLED" } } }),
    prisma.checkIn.count({ where: { eventId } }),
  ]);
  return { sold, checkedIn };
}

/**
 * Admits one ticket at the door of `eventId`. In one transaction: the ticket must
 * exist, belong to this event and be VALID; it's marked USED and a CheckIn row is
 * created. Two scanners reading the same ticket at once can't both admit it: the
 * status-guarded update lets only one through, and CheckIn.ticketId is unique.
 *
 * `afterAdmit` runs inside the same transaction (badges hook in here) and can add
 * the name of a badge unlocked by this check-in.
 */
export async function admitTicket(
  ref: TicketRef,
  eventId: string,
  scannedById: string,
  afterAdmit?: (tx: Prisma.TransactionClient, ticket: { id: string; ownerId: string; eventId: string }) => Promise<string | undefined>,
): Promise<ScanResult> {
  return prisma.$transaction(async (tx) => {
    const ticket = await tx.ticket.findUnique({
      where: "code" in ref ? { code: ref.code } : { id: ref.ticketId },
      select: {
        id: true,
        status: true,
        eventId: true,
        ownerId: true,
        owner: { select: { name: true } },
        tier: { select: { name: true } },
        event: { select: { status: true } },
        checkIn: { select: { checkedInAt: true } },
      },
    });
    // Never echo back an unknown code: it could be anything, including someone's secret
    if (!ticket) return { kind: "invalid" };

    const ticketCode = shortTicketCode(ticket.id);
    if (ticket.eventId !== eventId) return { kind: "wrong-event", ticketCode };
    if (ticket.status === "CANCELLED" || ticket.event.status === "CANCELLED") return { kind: "invalid", ticketCode };

    const alreadyUsed = (at: Date | undefined): ScanResult => ({
      kind: "already-used",
      name: ticket.owner.name,
      ticketCode,
      usedAtLabel: at ? timeLabel(at) : "an earlier scan",
    });
    if (ticket.status === "USED" || ticket.checkIn) return alreadyUsed(ticket.checkIn?.checkedInAt);

    const claimed = await tx.ticket.updateMany({ where: { id: ticket.id, status: "VALID" }, data: { status: "USED" } });
    if (claimed.count === 0) {
      // Another scanner admitted it a moment ago
      const other = await tx.checkIn.findUnique({ where: { ticketId: ticket.id }, select: { checkedInAt: true } });
      return alreadyUsed(other?.checkedInAt);
    }

    const checkIn = await tx.checkIn.create({
      data: { ticketId: ticket.id, eventId, scannedById },
      select: { checkedInAt: true },
    });
    const badgeUnlocked = afterAdmit ? await afterAdmit(tx, ticket) : undefined;

    return {
      kind: "success",
      name: ticket.owner.name,
      tierName: ticket.tier.name,
      quantity: 1,
      ticketCode,
      timeLabel: timeLabel(checkIn.checkedInAt),
      ...(badgeUnlocked ? { badgeUnlocked } : {}),
    };
  });
}

export type AttendeeMatch = {
  ticketId: string;
  name: string;
  email: string;
  tierName: string;
  ticketCode: string;
  status: "VALID" | "USED" | "CANCELLED";
};

/** Manual lookup for this event's tickets by attendee name, email or short ticket code. */
export async function findAttendees(eventId: string, query: string): Promise<AttendeeMatch[]> {
  const q = query.trim();
  if (!q) return [];
  const suffix = shortCodeSuffix(q);

  const tickets = await prisma.ticket.findMany({
    where: {
      eventId,
      OR: [
        { owner: { name: { contains: q, mode: "insensitive" } } },
        { owner: { email: { contains: q, mode: "insensitive" } } },
        ...(suffix ? [{ id: { endsWith: suffix, mode: "insensitive" as const } }] : []),
      ],
    },
    orderBy: [{ owner: { name: "asc" } }, { createdAt: "asc" }],
    take: 20,
    select: { id: true, status: true, owner: { select: { name: true, email: true } }, tier: { select: { name: true } } },
  });

  return tickets.map((t) => ({
    ticketId: t.id,
    name: t.owner.name,
    email: t.owner.email,
    tierName: t.tier.name,
    ticketCode: shortTicketCode(t.id),
    status: t.status,
  }));
}
