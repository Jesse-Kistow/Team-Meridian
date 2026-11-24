// lib/orders.ts
// Step 1 of Sprint 5 (US-504 core + the server half of US-501).
// Creates a PENDING order and reserves stock in ONE database transaction,
// and gives the stock back when an order is abandoned or expires.
import { prisma } from "./prisma";

// Safety cap per order. Not in the acceptance criteria; change it if you like.
export const MAX_TICKETS_PER_ORDER = 10;

// How long a PENDING order holds its tickets. Kept a little longer than the
// Stripe Checkout session (31 minutes) so Stripe always gives up first, and a
// payment can't complete after we've already handed the tickets to someone else.
export const ORDER_HOLD_MINUTES = 35;

/**
 * @param userId   the DATABASE user id (from getCurrentDbUser()), not the Clerk id
 * @param tierId   the ticket tier being bought
 * @param quantity how many tickets (1 to MAX_TICKETS_PER_ORDER)
 */
export async function createPendingOrder(userId: string, tierId: string, quantity: number) {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_TICKETS_PER_ORDER) {
    throw new Error(`Choose between 1 and ${MAX_TICKETS_PER_ORDER} tickets.`);
  }

  // Put back anything abandoned checkouts are still holding for this tier,
  // so a "sold out" tier frees up as soon as old holds run out.
  await releaseExpiredOrders({ tierId });

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
          expiresAt: new Date(now.getTime() + ORDER_HOLD_MINUTES * 60_000),
          items: { create: { tierId, quantity, unitPriceCents: tier.priceCents } },
        },
      });
    },
    // 20 simultaneous buyers queue for a small connection pool, so allow some waiting.
    { maxWait: 10_000, timeout: 10_000 },
  );
}

/**
 * Cancels a still-PENDING order and gives its tickets back.
 * Safe to call twice, or from two places at once: only a PENDING order is changed,
 * so the stock is returned exactly once. Returns true if it released the order.
 */
export async function releaseOrder(orderId: string, status: "FAILED" | "CANCELLED" = "FAILED") {
  return prisma.$transaction(async (tx) => {
    const changed = await tx.order.updateMany({
      where: { id: orderId, status: "PENDING" },
      data: { status },
    });
    if (changed.count === 0) return false;

    const items = await tx.orderItem.findMany({ where: { orderId } });
    for (const item of items) {
      await tx.$executeRaw`
        UPDATE "TicketTier"
        SET "quantitySold" = GREATEST("quantitySold" - ${item.quantity}, 0)
        WHERE "id" = ${item.tierId}`;
    }
    return true;
  });
}

/**
 * Cancels PENDING orders whose hold has run out and returns their tickets.
 * Pass a tierId or eventId to only look at those orders. Returns how many were released.
 */
export async function releaseExpiredOrders(
  { tierId, eventId, now = new Date() }: { tierId?: string; eventId?: string; now?: Date } = {},
) {
  const expired = await prisma.order.findMany({
    where: {
      status: "PENDING",
      expiresAt: { lt: now },
      ...(eventId ? { eventId } : {}),
      ...(tierId ? { items: { some: { tierId } } } : {}),
    },
    select: { id: true },
    take: 100,
  });

  let released = 0;
  for (const order of expired) {
    if (await releaseOrder(order.id, "CANCELLED")) released++;
  }
  return released;
}
