// lib/orders.ts
// Order creation, release and fulfilment. Used by checkout (Steps 1-3),
// the Stripe webhook and success page (Step 4) and expiry (Step 6).
import { prisma } from "./prisma";

// Safety cap per order. Not in the acceptance criteria; change it if you like.
export const MAX_TICKETS_PER_ORDER = 10;

// Stripe cannot charge less than 50 US cents, so cheaper (or free) orders are refused for now.
export const MIN_CHARGE_CENTS = 50;

// How long a PENDING order holds its tickets. Kept a little longer than the
// Stripe Checkout session (31 minutes) so Stripe always gives up first, and a
// payment can't normally complete after we've handed the tickets to someone else.
export const ORDER_HOLD_MINUTES = 35;

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
          expiresAt: new Date(now.getTime() + ORDER_HOLD_MINUTES * 60_000),
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
 * Safe to call twice, or from two places at once: only a PENDING order is changed,
 * so the stock is returned exactly once. Returns true if it released the order.
 * Used when Stripe fails (Step 3) and for failed or expired payments (Step 6).
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

/** Keeps a PENDING order's tickets held with no time limit (a slow bank payment is on its way). */
export async function holdOrderIndefinitely(orderId: string) {
  await prisma.order.updateMany({ where: { id: orderId, status: "PENDING" }, data: { expiresAt: null } });
}

class LateOrderNoStock extends Error {}

export type MarkPaidResult =
  | "paid" // this call marked it PAID and issued the tickets
  | "already_paid" // an earlier call (webhook retry or the success page) already did
  | "needs_refund" // paid after its hold was released, and the tickets are gone: refund the buyer
  | "not_found";

/**
 * Marks an order PAID and issues one Ticket per seat, in one transaction.
 * Safe to call more than once (Stripe retries webhooks, and the success page calls it too):
 * only the first call changes anything.
 *
 * If the hold was already released (the payment arrived after expiry), it tries to
 * reserve the tickets again. If they've been sold to someone else it returns
 * "needs_refund" and changes nothing.
 */
export async function markOrderPaid(orderId: string): Promise<MarkPaidResult> {
  try {
    return await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true, event: { select: { title: true } } },
      });
      if (!order) return "not_found";
      if (order.status === "PAID") return "already_paid";
      if (order.status === "REFUNDED") return "needs_refund";

      // Claim the order. The status check in the WHERE makes this safe against a
      // second call running at the same time: only one of them changes the row.
      const claimed = await tx.order.updateMany({
        where: { id: orderId, status: order.status },
        data: { status: "PAID", expiresAt: null },
      });
      if (claimed.count === 0) return "already_paid";

      if (order.status !== "PENDING") {
        // The hold was released, so the stock went back. Take it again if it's still there.
        for (const item of order.items) {
          const reserved = await tx.$executeRaw`
            UPDATE "TicketTier"
            SET "quantitySold" = "quantitySold" + ${item.quantity}
            WHERE "id" = ${item.tierId} AND "quantity" - "quantitySold" >= ${item.quantity}`;
          if (reserved === 0) throw new LateOrderNoStock(); // rolls the whole transaction back
        }
      }

      await tx.ticket.createMany({
        data: order.items.flatMap((item) =>
          Array.from({ length: item.quantity }, () => ({
            orderId: order.id,
            tierId: item.tierId,
            eventId: order.eventId,
            ownerId: order.userId,
          })),
        ),
      });

      const count = order.items.reduce((sum, item) => sum + item.quantity, 0);
      await tx.notification.create({
        data: {
          userId: order.userId,
          type: "ORDER_CONFIRMED",
          title: `You're going to ${order.event.title}`,
          body: `${count} ticket${count === 1 ? "" : "s"} confirmed.`,
          href: "/my-tickets",
        },
      });
      return "paid";
    });
  } catch (error) {
    if (error instanceof LateOrderNoStock) return "needs_refund";
    throw error;
  }
}

/** Records that a late payment for a released order was refunded (its stock was already returned). */
export async function markOrderRefunded(orderId: string) {
  await prisma.order.updateMany({
    where: { id: orderId, status: { in: ["FAILED", "CANCELLED"] } },
    data: { status: "REFUNDED", expiresAt: null },
  });
}
