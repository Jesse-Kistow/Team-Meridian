import EventsList from "@/components/organizer/EventsList";

// DEMO DATA. Replace with: prisma.event.findMany({ where: { organizerId: me.id } })
// plus tier totals (sum quantity / quantitySold) mapped into OrganizerEventRow.
export default function OrganizerEventsPage() {
  return (
    <EventsList
      organizerName="Nightshift Collective"
      events={[
        { id: "e1", title: "After Hours", venueLabel: "The Glasshouse · Brooklyn, NY", dateLabel: "Oct 23, 2026", timeLabel: "7:00 PM", status: "PUBLISHED", sold: 248, capacity: 300 },
        { id: "e2", title: "After Hours: Vol. 02", venueLabel: "The Glasshouse · Brooklyn, NY", dateLabel: "Nov 20, 2026", timeLabel: "7:00 PM", status: "DRAFT", sold: 0, capacity: 0 },
        { id: "e3", title: "Rooftop Sessions", venueLabel: "The Skyline · Brooklyn, NY", dateLabel: "Nov 14, 2026", timeLabel: "6:00 PM", status: "PUBLISHED", sold: 86, capacity: 150 },
        { id: "e4", title: "Midnight Social", venueLabel: "Studio 18 · Brooklyn, NY", dateLabel: "Oct 10, 2026", timeLabel: "9:00 PM", status: "CANCELLED", sold: 0, capacity: 0 },
      ]}
    />
  );
}
