import DiscoverPage from "@/components/discover/DiscoverPage";

// DEMO DATA. Next step: read ?q= and ?category= from searchParams (wrap in <Suspense>),
// query published, upcoming events with Prisma, and compute fromPriceCents = min(tier.priceCents).
export default function EventsPage() {
  return (
    <DiscoverPage
      cityLabel="New York, NY"
      categories={[
        { key: "music", label: "Music" },
        { key: "arts", label: "Art & culture" },
        { key: "food", label: "Food" },
      ]}
      featured={{ id: "demo", title: "After Hours", dateLabel: "FRI, OCT 23 · 7 PM", locationLabel: "BROOKLYN", fromPriceCents: 3500, imageUrl: null, tag: "THE WEEKEND EDIT", tagline: "Sound. Light. Stay a little longer." }}
      picks={[
        { id: "p1", title: "Objects & Other Stories", dateLabel: "SAT, OCT 24 · 2 PM", locationLabel: "Chelsea", fromPriceCents: 1800, imageUrl: null },
        { id: "p2", title: "Sunday in Blue", dateLabel: "SUN, OCT 25 · 6 PM", locationLabel: "Williamsburg", fromPriceCents: 2200, imageUrl: null },
      ]}
    />
  );
}
