// lib/stripe.ts
// One shared Stripe client. Server-side only: never import this into a "use client" file.
// Created on first use, not at import, so `next build` works without STRIPE_SECRET_KEY
// (the build loads route modules such as the webhook to read their config).
import Stripe from "stripe";

let client: Stripe | null = null;

function getStripe(): Stripe {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set. Add it to your .env file and restart the dev server.");
    client = new Stripe(key);
  }
  return client;
}

export const stripe = new Proxy({} as Stripe, {
  get: (_target, property) => Reflect.get(getStripe(), property),
});
