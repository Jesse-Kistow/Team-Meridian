// lib/stripe.ts  (NEW)
// One shared Stripe client. Server-side only: never import this into a "use client" file.
import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;
if (!key) throw new Error("STRIPE_SECRET_KEY is not set. Add it to your .env file and restart the dev server.");

export const stripe = new Stripe(key);