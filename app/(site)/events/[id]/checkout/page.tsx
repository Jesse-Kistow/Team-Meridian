// Step 2: US-501. "Get tickets" on the event page lands here.
// Signed-in only (see middleware.ts); paying happens on Stripe's hosted page.
import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import EventCheckout from "@/components/checkout/EventCheckout";
import { getPublishedEvent, remainingNow, shortDate, time } from "@/lib/events/public";
import { MAX_TICKETS_PER_ORDER } from "@/lib/orders";

async function CheckoutContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Render per request: ticket availability depends on the current time
  await connection();
  const event = await getPublishedEvent(id);
  if (!event) notFound();

  // Only plain, serializable values go to the client component
  return (
    <EventCheckout
      event={{
        id: event.id,
        title: event.title,
        dateLabel: `${shortDate(event.startsAt)} · ${time(event.startsAt)}`,
        locationLabel: `${event.venue}, ${event.city}`,
        imageUrl: event.imageUrl,
      }}
      tiers={event.tiers.map((tier) => ({
        id: tier.id,
        name: tier.name,
        description: tier.description,
        priceCents: tier.priceCents,
        remaining: remainingNow(tier),
      }))}
      maxPerOrder={MAX_TICKETS_PER_ORDER}
    />
  );
}

// params is a Promise, and reading it happens inside Suspense because cacheComponents is on
export default function CheckoutPage({ params }: PageProps<"/events/[id]/checkout">) {
  return (
    <Suspense>
      <CheckoutContent params={params} />
    </Suspense>
  );
}
