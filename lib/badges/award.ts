// Awards badges after a check-in (US-902, US-904, US-905). Runs inside the
// check-in transaction (passed to admitTicket as `afterAdmit`), so a check-in and
// its badges and notifications are saved together or not at all.
import "server-only";
import type { Prisma } from "../../generated/prisma/client";
import { badgeDefinition, qualifyingBadges } from "./rules";

/**
 * Evaluates the rules for the ticket that was just checked in and awards any new
 * badges, each with a BADGE_EARNED notification. Safe to run again: the
 * UserBadge (userId, badgeId) unique constraint means an insert that already
 * exists is skipped (ON CONFLICT DO NOTHING), and only a real insert creates a
 * notification. Returns the names of badges earned by this check-in, if any.
 */
export async function awardBadgesForCheckIn(
  tx: Prisma.TransactionClient,
  ticket: { id: string; ownerId: string },
): Promise<string | undefined> {
  const [facts, attended] = await Promise.all([
    tx.ticket.findUniqueOrThrow({
      where: { id: ticket.id },
      select: { tier: { select: { name: true } }, order: { select: { createdAt: true } }, event: { select: { startsAt: true } } },
    }),
    tx.checkIn.findMany({ where: { ticket: { ownerId: ticket.ownerId } }, distinct: ["eventId"], select: { eventId: true } }),
  ]);

  const keys = qualifyingBadges({
    eventsAttended: attended.length,
    orderedAt: facts.order.createdAt,
    eventStartsAt: facts.event.startsAt,
    tierName: facts.tier.name,
  });

  const earned: string[] = [];
  for (const key of keys) {
    const def = badgeDefinition(key);
    // Creates the badge definition the first time, if the seed hasn't run
    // (skipDuplicates, so two first-ever check-ins at once can't collide on Badge.key)
    await tx.badge.createMany({ data: [def], skipDuplicates: true });
    const badge = await tx.badge.findUniqueOrThrow({ where: { key }, select: { id: true, name: true, description: true } });
    // Not a plain create: a duplicate insert would abort the whole Postgres transaction (and the check-in)
    const inserted = await tx.userBadge.createMany({ data: [{ userId: ticket.ownerId, badgeId: badge.id }], skipDuplicates: true });
    if (inserted.count === 0) continue; // already had it

    await tx.notification.create({
      data: {
        userId: ticket.ownerId,
        type: "BADGE_EARNED",
        title: `You earned the ${badge.name} badge`,
        body: badge.description,
        href: "/profile",
      },
    });
    earned.push(badge.name);
  }

  return earned.length ? earned.join(", ") : undefined;
}
