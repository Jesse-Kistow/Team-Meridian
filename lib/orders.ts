// lib/orders.ts  (REPLACES the Step 1 version)
// Order creation and release. Used by checkout (Steps 1-3), the webhook (Step 4) and expiry (Step 6).
import { prisma } from "./prisma";

// Safety cap per order. Not in the acceptance criteria; change it if you like.
export const MAX_TICKETS_PER_ORDER = 10;

// Stripe cannot charge less than 50 US cents, so cheaper (or free) orders are refused for now.
export const MIN_CHARGE_CENTS = 50;

// Errors that are safe to show to the buyer. Anything else is unexpected and gets a generic message.
export class CheckoutError extends Error {}

/**
 * Creates a PENDING order and reserves the stock in ONE database transaction.
 * @param userId   the DATABASE user id (from getCurrentDbUser()), not the Clerk id
 * @param tierId   the ticket tier being bought
 * @param quantity how many tickets (1 to MAX_TICKETS_PER_ORDER)
 */
export async function createPendingOrder(userId: string, tierId: string, quantity: number) {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_TICKETS_PER_ORDER) {
    throw new CheckoutError(`Choose between 1 and ${MAX_TICKETS_PER_ORDER} tickets.`);
  }

  return prisma.$transaction(
    async (tx) => {
      const tier = await tx.ticketTier.findUnique({
        where: { id: tierId },
        include: { event: true },
      });
      if (!tier || tier.event.status !== "PUBLISHED") {
        throw new CheckoutError("This ticket is not on sale.");
      }

      const now = new Date();
      if (tier.salesStart && tier.salesStart > now) throw new CheckoutError("Sales have not started yet.");
      if (tier.salesEnd && tier.salesEnd < now) throw new CheckoutError("Sales have ended.");

      const totalCents = tier.priceCents * quantity;
      if (totalCents < MIN_CHARGE_CENTS) {
        throw new CheckoutError("Free and very cheap tickets are not supported yet.");
      }

      // The key line. The UPDATE only changes the row if enough tickets remain, and
      // Postgres makes concurrent updates to the same row wait for each other, so two
      // buyers can never both take the last ticket. "reserved" is the number of rows changed.
      const reserved = await tx.$executeRaw`
        UPDATE "TicketTier"
        SET "quantitySold" = "quantitySold" + ${quantity}
        WHERE "id" = ${tierId} AND "quantity" - "quantitySold" >= ${quantity}`;
      if (reserved === 0) throw new CheckoutError("Not enough tickets left.");

      return tx.order.create({
        data: {
          userId,
          eventId: tier.eventId,
          totalCents,
          items: { create: { tierId, quantity, unitPriceCents: tier.priceCents } },
        },
        // Checkout needs these to describe the order to Stripe
        include: { event: true, items: { include: { tier: true } } },
      });
    },
    // 20 simultaneous buyers queue for a small connection pool, so allow some waiting.
    { maxWait: 10_000, timeout: 10_000 },
  );
}

/**
 * Cancels a still-PENDING order and gives its tickets back.
 * Safe to call twice: only a PENDING order is changed. Returns true if it released the order.
 * Used when Stripe fails (Step 3) and later for failed or expired payments (Step 6).
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