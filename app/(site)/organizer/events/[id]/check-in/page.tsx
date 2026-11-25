import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { getCurrentDbUser } from "@/lib/current-user";
import { getCheckInCounts, getOwnedEvent } from "@/lib/checkin/check-in";
import { fmt } from "@/lib/tickets/display";
import CheckInClient from "./CheckInClient";

// US-701 to 706: door check-in for an event you own. Other organizers get a 404,
// and the server actions refuse them too (403).
async function CheckIn({ params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentDbUser();
  if (!me || me.role !== "ORGANIZER") redirect("/");

  const { id } = await params;
  const event = await getOwnedEvent(id, me.id);
  if (!event) notFound();

  const { sold, checkedIn } = await getCheckInCounts(event.id);
  const now = new Date();

  return (
    <CheckInClient
      event={{
        id: event.id,
        title: event.title,
        dateLabel: fmt(event.startsAt, { month: "short", day: "numeric", year: "numeric" }),
        locationLabel: event.venue,
        imageUrl: event.imageUrl,
        status: event.status,
        isLive: event.status === "PUBLISHED" && event.startsAt <= now && now < event.endsAt,
      }}
      sold={sold}
      checkedIn={checkedIn}
    />
  );
}

export default function CheckInPage({ params }: PageProps<"/organizer/events/[id]/check-in">) {
  return (
    <Suspense fallback={<p className="px-4 py-12 text-center text-sm text-[#79747F]">Loading check-in…</p>}>
      <CheckIn params={params} />
    </Suspense>
  );
}
