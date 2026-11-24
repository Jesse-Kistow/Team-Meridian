export type EventCardData = {
  id: string;
  title: string;
  dateLabel: string; // e.g. "SAT, OCT 24 · 2 PM"
  locationLabel: string; // e.g. "Chelsea"
  fromPriceCents: number | null; // lowest tier price; null = no tiers yet
  imageUrl: string | null;
};

export type FeaturedEvent = EventCardData & {
  tag?: string; // e.g. "THE WEEKEND EDIT"
  tagline?: string; // short line under the title
};

export type CategoryPill = { key: string; label: string };
