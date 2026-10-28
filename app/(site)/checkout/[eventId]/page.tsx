// app/(site)/checkout/[eventId]/page.tsx  (NEW)  Step 2: US-501
// The event detail page (US-404, Sprint 4) will later link here with a "Get tickets" button.
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import BuyTicketsForm from "@/components/checkout/BuyTicketsForm";

async function CheckoutContent({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;

  const event = await prisma.event.findFirst({
    where: { id: eventId, status: "PUBLISHED" },
    include: { tiers: { orderBy: { priceCents: "asc" } } },
  });
  if (!event) notFound();

  // Only plain, serializable values go to the client component
  const tiers = event.tiers.map((tier) => ({
    id: tier.id,
    name: tier.name,
    description: tier.description,
    priceCents: tier.priceCents,
    remaining: Math.max(tier.quantity - tier.quantitySold, 0),
  }));

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 px-6 py-12">
      <div>
        <p className="text-xs font-extrabold text-violet-600">GET TICKETS</p>
        <h1 className="mt-2 text-4xl font-extrabold text-neutral-800">{event.title}</h1>
        <p className="mt-2 text-sm text-zinc-500">
          {event.venue}, {event.city}
        </p>
      </div>
      <BuyTicketsForm tiers={tiers} />
    </div>
  );
}

// params is a Promise, and reading it happens inside Suspense because cacheComponents is on
export default function Page({ params }: { params: Promise<{ eventId: string }> }) {
  return (
    <Suspense>
      <CheckoutContent params={params} />
    </Suspense>
  );
}
