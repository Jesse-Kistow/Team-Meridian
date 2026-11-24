import MyTickets from "@/components/tickets/MyTickets";

// DEMO DATA. Replace with the signed-in user's Ticket rows (ownerId = me.id), joined with event + tier.
// Upcoming = event.startsAt in the future, soonest first. Past = already happened, most recent first.
// outcome: ticket.status USED -> ATTENDED, VALID but past -> MISSED, CANCELLED -> CANCELLED.
// The wrapper must live inside <Suspense> because it reads the signed-in user.
export default function MyTicketsPage() {
  return (
    <MyTickets
      upcoming={[
        {
          id: "t1",
          eventTitle: "After Hours",
          dateLabel: "Fri, Oct 23, 2026 · 7:00 PM",
          locationLabel: "The Glasshouse, Brooklyn",
          imageUrl: null,
          status: "CONFIRMED",
          ticketCount: 1,
          tierName: "General admission",
          holderName: "Maya Chen",
          ticketCode: "EA-10482",
          href: "/my-tickets/t1",
        },
      ]}
      past={[
        { id: "p1", month: "OCT", day: "04", title: "Sunday Sessions", locationLabel: "Williamsburg, Brooklyn", dateLabel: "Sun, Oct 4, 2026", timeLabel: "6:00 PM · 1 ticket", outcome: "ATTENDED", href: "/my-tickets/p1" },
        { id: "p2", month: "SEP", day: "26", title: "Open Studio", locationLabel: "Chelsea, Manhattan", dateLabel: "Sat, Sep 26, 2026", timeLabel: "2:00 PM · 1 ticket", outcome: "ATTENDED", href: "/my-tickets/p2" },
        { id: "p3", month: "SEP", day: "12", title: "Rooftop Frequencies", locationLabel: "Greenpoint, Brooklyn", dateLabel: "Sat, Sep 12, 2026", timeLabel: "8:00 PM · 1 ticket", outcome: "ATTENDED", href: "/my-tickets/p3" },
        { id: "p4", month: "AUG", day: "22", title: "Late Checkout", locationLabel: "Bushwick, Brooklyn", dateLabel: "Sat, Aug 22, 2026", timeLabel: "9:00 PM · 1 ticket", outcome: "ATTENDED", href: "/my-tickets/p4" },
        { id: "p5", month: "AUG", day: "08", title: "City Sounds", locationLabel: "Lower East Side, Manhattan", dateLabel: "Sat, Aug 8, 2026", timeLabel: "8:00 PM · 1 ticket", outcome: "ATTENDED", href: "/my-tickets/p5" },
      ]}
    />
  );
}
