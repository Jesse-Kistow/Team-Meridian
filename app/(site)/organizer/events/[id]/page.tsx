import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import EventDashboard from "@/components/organizer/EventDashboard";
import { getCurrentOrganizer, getOrganizerEventDashboard } from "@/lib/events/organizer-data";

async function Dashboard({ params }: { params: Promise<{ id: string }> }) {
  const organizer = await getCurrentOrganizer();
  if (!organizer) redirect("/");

  const { id } = await params;
  // Returns null for events that don't exist or belong to another organizer,
  // so both cases look the same from outside.
  const data = await getOrganizerEventDashboard(id, organizer.id);
  if (!data) notFound();

  return <EventDashboard {...data} checkInHref={`/organizer/events/${data.event.id}/check-in`} />;
}

export default function EventDashboardPage({ params }: PageProps<"/organizer/events/[id]">) {
  return (
    <Suspense fallback={<p className="px-4 py-12 text-center text-sm text-[#79747F]">Loading dashboard…</p>}>
      <Dashboard params={params} />
    </Suspense>
  );
}
