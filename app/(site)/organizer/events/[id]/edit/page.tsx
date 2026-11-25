import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentOrganizer } from "@/lib/events/organizer-data";
import EditEventForm from "./EditEventForm";

// US-202 / US-204: edit an event you own. Other organizers get a 404.
async function EditEvent({ params }: { params: Promise<{ id: string }> }) {
  const organizer = await getCurrentOrganizer();
  if (!organizer) redirect("/");

  const { id } = await params;
  const event = await prisma.event.findFirst({
    where: { id, organizerId: organizer.id },
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      venue: true,
      city: true,
      imageUrl: true,
      startsAt: true,
      endsAt: true,
      status: true,
      tiers: { orderBy: { createdAt: "asc" }, select: { id: true, name: true, priceCents: true, quantity: true } },
    },
  });
  if (!event) notFound();
  // Cancelled events are read-only: send the organizer back to the dashboard
  if (event.status === "CANCELLED") redirect(`/organizer/events/${event.id}`);

  return (
    <EditEventForm
      event={{ ...event, startsAt: event.startsAt.toISOString(), endsAt: event.endsAt.toISOString() }}
    />
  );
}

export default function EditEventPage({ params }: PageProps<"/organizer/events/[id]/edit">) {
  return (
    <Suspense fallback={<p className="px-4 py-12 text-center text-sm text-[#79747F]">Loading event…</p>}>
      <EditEvent params={params} />
    </Suspense>
  );
}
