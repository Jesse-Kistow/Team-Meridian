import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import EventDetail from "@/components/event/EventDetail";
import { prisma } from "@/lib/prisma";
import { getPublishedEvent, longDate, remainingNow, time } from "@/lib/events/public";

async function EventContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Render per request: ticket availability depends on the current time
  await connection();
  const event = await getPublishedEvent(id);
  if (!event) notFound();

  const eventCount = await prisma.event.count({
    where: { organizerId: event.organizer.id, status: "PUBLISHED" },
  });
  const fromPriceCents = event.tiers.length ? Math.min(...event.tiers.map((t) => t.priceCents)) : null;
  const soldOut = event.tiers.length > 0 && event.tiers.every((t) => remainingNow(t) === 0);

  return (
    <EventDetail
      event={{
        id: event.id,
        title: event.title,
        category: event.category,
        description: event.description,
        imageUrl: event.imageUrl,
        dateLabel: longDate(event.startsAt),
        timeLabel: `${time(event.startsAt)} – ${time(event.endsAt)}`,
        venue: event.venue,
        address: event.city,
      }}
      organizer={{ name: event.organizer.organizationName ?? event.organizer.name, eventCount }}
      fromPriceCents={fromPriceCents}
      soldOut={soldOut}
    />
  );
}

// Reading `params` needs a <Suspense> boundary under Cache Components.
export default function EventPage({ params }: PageProps<"/events/[id]">) {
  return (
    <Suspense>
      <EventContent params={params} />
    </Suspense>
  );
}
