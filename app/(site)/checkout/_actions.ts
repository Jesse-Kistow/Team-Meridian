"use server";

// app/(site)/checkout/_actions.ts  (NEW)  Steps 2 and 3: US-501 and US-502
import { redirect } from "next/navigation";
import { getCurrentDbUser } from "@/lib/current-user";
import { CheckoutError, createPendingOrder, releaseOrder } from "@/lib/orders";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function startCheckout(tierId: string, quantity: number): Promise<{ error: string }> {
  // Only signed-in users can buy (the middleware also protects the /checkout pages)
  const user = await getCurrentDbUser();
  if (!user) return { error: "Please sign in to buy tickets." };

  // 1. Reserve the tickets and create the PENDING order (Step 1)
  let order: Awaited<ReturnType<typeof createPendingOrder>>;
  try {
    order = await createPendingOrder(user.id, tierId, quantity);
  } catch (error) {
    if (error instanceof CheckoutError) return { error: error.message };
    console.error("createPendingOrder failed", error);
    return { error: "Something went wrong starting checkout. Please try again." };
  }

  // 2. Ask Stripe for a hosted payment page
  let checkoutUrl: string;
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      client_reference_id: order.id,
      metadata: { orderId: order.id }, // the webhook (Step 4) finds the order from this
      customer_email: user.email,
      line_items: order.items.map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency: order.currency,
          unit_amount: item.unitPriceCents,
          product_data: { name: `${order.event.title}: ${item.tier.name}` },
        },
      })),
      success_url: `${APP_URL}/checkout/success?order=${order.id}`,
      cancel_url: `${APP_URL}/checkout/${order.eventId}`,
      // Stripe needs at least 30 minutes, so ask for 31 to be safe
      expires_at: Math.floor(Date.now() / 1000) + 31 * 60,
    });
    if (!session.url) throw new Error("Stripe returned no checkout URL");

    await prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId: session.id },
    });
    checkoutUrl = session.url;
  } catch (error) {
    console.error("Stripe checkout failed", error);
    await releaseOrder(order.id); // give the reserved tickets back
    return { error: "We couldn't open the payment page. Please try again." };
  }

  // 3. Send the buyer to Stripe. redirect() must stay outside try/catch.
  redirect(checkoutUrl);
}
