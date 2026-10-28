// lib/orders.ts
// Step 1 of Sprint 5 (US-504 core + the server half of US-501).
// Creates a PENDING order and reserves stock in ONE database transaction.
import { prisma } from "./prisma";

// Safety cap per order. Not in the acceptance criteria; change it if you like.
export const MAX_TICKETS_PER_ORDER = 10;

/**
 * @param userId   the DATABASE user id (from getCurrentDbUser()), not the Clerk id
 * @param tierId   the ticket tier being bought
 * @param quantity how many tickets (1 to MAX_TICKETS_PER_ORDER)
 */
export async function createPendingOrder(userId: string, tierId: string, quantity: number) {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_TICKETS_PER_ORDER) {
    throw new Error(`Choose between 1 and ${MAX_TICKETS_PER_ORDER} tickets.`);
  }

  return prisma.$transaction(
    async (tx) => {
      const tier = await tx.ticketTier.findUnique({
        where: { id: tierId },
        include: { event: true },
      });
      if (!tier || tier.event.status !== "PUBLISHED") {
        throw new Error("This ticket is not on sale.");
      }

      const now = new Date();
      if (tier.salesStart && tier.salesStart > now) throw new Error("Sales have not started yet.");
      if (tier.salesEnd && tier.salesEnd < now) throw new Error("Sales have ended.");

      // The key line. The UPDATE only changes the row if enough tickets remain, and
      // Postgres makes concurrent updates to the same row wait for each other, so two
      // buyers can never both take the last ticket. "reserved" is the number of rows changed.
      const reserved = await tx.$executeRaw`
        UPDATE "TicketTier"
        SET "quantitySold" = "quantitySold" + ${quantity}
        WHERE "id" = ${tierId} AND "quantity" - "quantitySold" >= ${quantity}`;
      if (reserved === 0) throw new Error("Not enough tickets left.");

      return tx.order.create({
        data: {
          userId,
          eventId: tier.eventId,
          totalCents: tier.priceCents * quantity,
          items: { create: { tierId, quantity, unitPriceCents: tier.priceCents } },
        },
      });
    },
    // 20 simultaneous buyers queue for a small connection pool, so allow some waiting.
    { maxWait: 10_000, timeout: 10_000 },
  );
}