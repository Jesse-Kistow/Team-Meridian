// app/api/stripe/webhook/route.ts  Step 4: US-503
// Stripe calls this when a Checkout Session completes, expires or a slow payment settles.
// Set it up in the Stripe dashboard (Developers > Webhooks) with these events:
//   checkout.session.completed, checkout.session.async_payment_succeeded,
//   checkout.session.async_payment_failed, checkout.session.expired
// Locally:  stripe listen --forward-to localhost:3000/api/stripe/webhook
// and put the whsec_... it prints into STRIPE_WEBHOOK_SECRET.
import type Stripe from "stripe";
import { handleStripeEvent } from "@/lib/checkout";
import { stripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return new Response("Webhook not configured", { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  // The signature covers the exact bytes Stripe sent, so read the raw body.
  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    const outcome = await handleStripeEvent(event);
    if (outcome !== "ignored") console.info(`Stripe ${event.type} ${event.id}: ${outcome}`);
  } catch (error) {
    // A 500 makes Stripe retry later, which is what we want for a database hiccup.
    console.error(`Stripe ${event.type} ${event.id} failed`, error);
    return new Response("Webhook handler failed", { status: 500 });
  }
  return Response.json({ received: true });
}
