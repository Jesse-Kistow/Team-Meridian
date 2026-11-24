import { Suspense } from "react";
import { redirect } from "next/navigation";
import EventsList from "@/components/organizer/EventsList";
import { getCurrentOrganizer, getOrganizerEventRows } from "@/lib/events/organizer-data";

// US-205: lists only the signed-in organizer's events, newest first.
async function MyEvents() {
  const organizer = await getCurrentOrganizer();
  if (!organizer) redirect("/");

  const events = await getOrganizerEventRows(organizer.id);
  return <EventsList organizerName={organizer.organizationName ?? organizer.name} events={events} />;
}

export default function OrganizerEventsPage() {
  return (
    <Suspense fallback={<p className="px-4 py-12 text-center text-sm text-[#79747F]">Loading your events…</p>}>
      <MyEvents />
    </Suspense>
  );
}
