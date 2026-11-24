// lib/checkout.ts  Step 4: US-503
// Turns a Stripe Checkout Session into order changes. Shared by the webhook
// (the reliable path) and the success page (so a buyer sees their tickets right
// away even if the webhook is slow or isn't set up on a dev machine).
import "server-only";
import type Stripe from "stripe";
import { holdOrderIndefinitely, markOrderPaid, markOrderRefunded, releaseOrder } from "./orders";
import { stripe } from "./stripe";

export type SessionOutcome = "paid" | "already_paid" | "waiting" | "refunded" | "released" | "ignored";

/** The order id we put on the session in startCheckout. */
export function orderIdFromSession(session: Stripe.Checkout.Session): string | null {
  return session.metadata?.orderId ?? session.client_reference_id ?? null;
}

/**
 * The buyer finished Stripe Checkout (or a slow payment cleared).
 * Card payments are "paid" straight away. Bank debits can be "unpaid" here and
 * succeed or fail days later, so their tickets stay held until then.
 */
export async function fulfillCheckoutSession(session: Stripe.Checkout.Session): Promise<SessionOutcome> {
  const orderId = orderIdFromSession(session);
  if (!orderId) return "ignored";

  if (session.payment_status === "unpaid") {
    if (session.status === "complete") {
      await holdOrderIndefinitely(orderId);
      return "waiting";
    }
    return "ignored";
  }

  const result = await markOrderPaid(orderId);
  if (result === "not_found") return "ignored";
  if (result === "needs_refund") {
    // Paid after the hold ran out, and the tickets were sold to someone else.
    const paymentIntent =
      typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
    if (paymentIntent) {
      await stripe.refunds.create(
        { payment_intent: paymentIntent, metadata: { orderId, reason: "tickets_no_longer_available" } },
        // Retries (webhook redelivery, success page) must not refund twice
        { idempotencyKey: `refund-late-order-${orderId}` },
      );
    }
    await markOrderRefunded(orderId);
    console.warn(`Order ${orderId} was paid after its hold expired and the tickets were gone; refunded.`);
    return "refunded";
  }
  return result;
}

/** Handles one verified webhook event. Returns what happened, for logging. */
export async function handleStripeEvent(event: Stripe.Event): Promise<SessionOutcome> {
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      return fulfillCheckoutSession(event.data.object);

    case "checkout.session.expired":
    case "checkout.session.async_payment_failed": {
      const orderId = orderIdFromSession(event.data.object);
      if (!orderId) return "ignored";
      const status = event.type === "checkout.session.expired" ? "CANCELLED" : "FAILED";
      return (await releaseOrder(orderId, status)) ? "released" : "ignored";
    }

    default:
      return "ignored";
  }
}
