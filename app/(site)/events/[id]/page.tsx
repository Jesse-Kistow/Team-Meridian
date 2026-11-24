import EventDetail from "@/components/event/EventDetail";

// DEMO DATA. Next step: load the event by id (PUBLISHED only, else notFound()), compute
// fromPriceCents = min tier price and soldOut = every tier has quantitySold >= quantity.
// Reading `params` needs a <Suspense> boundary under Cache Components.
export default function EventPage() {
  return (
    <EventDetail
      event={{
        id: "demo",
        title: "After Hours",
        category: "Music + Culture",
        tagline: "A night for the ones who aren't done yet.",
        headline: "Good music. Better company.",
        description: "Three DJs, immersive light installations, and a warehouse dance floor. Come for the sound. Stay for the people.",
        imageUrl: null,
        dateLabel: "Friday, October 23, 2026",
        timeLabel: "7:00 PM – 12:00 AM",
        doorsLabel: "Doors at 6:30 PM",
        venue: "The Glasshouse",
        address: "84 Kent Ave, Brooklyn, NY",
        ageRestriction: "21+",
      }}
      organizer={{ name: "Nightshift Collective", verified: true, eventCount: 12 }}
      fromPriceCents={3500}
    />
  );
}
