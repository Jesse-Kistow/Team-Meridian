import EventDashboard from "@/components/organizer/EventDashboard";

// DEMO DATA. Replace with Prisma queries for the event with this id
// (check event.organizerId === the signed-in user, then wrap the data in <Suspense> as needed).
export default function EventDashboardPage() {
  return (
    <EventDashboard
      event={{
        id: "demo",
        title: "After Hours",
        dateLabel: "Oct 23, 2026",
        locationLabel: "The Glasshouse",
        imageUrl: null,
        status: "PUBLISHED",
        isLive: true,
      }}
      grossCents={932000}
      grossChangePct={18}
      sold={248}
      capacity={300}
      daily={[
        { label: "17", count: 14 },
        { label: "18", count: 22 },
        { label: "19", count: 18 },
        { label: "20", count: 31 },
        { label: "21", count: 27 },
        { label: "22", count: 42 },
        { label: "23", count: 50 },
      ]}
      tiers={[
        { id: "t1", name: "Early bird", sold: 50, capacity: 50, grossCents: 125000 },
        { id: "t2", name: "General admission", sold: 160, capacity: 200, grossCents: 560000 },
        { id: "t3", name: "VIP", sold: 38, capacity: 50, grossCents: 247000 },
      ]}
      checkedIn={187}
      checkInHref="/organizer/events/demo/check-in"
    />
  );
}
