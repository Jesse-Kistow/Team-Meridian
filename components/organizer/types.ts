// Shapes the organizer screens expect. They mirror the Prisma models, but the
// components never import Prisma: the page maps database rows into these.

export type EventStatus = "DRAFT" | "PUBLISHED" | "CANCELLED";

export type EventSummary = {
  id: string;
  title: string;
  dateLabel: string; // e.g. "Oct 23, 2026"
  locationLabel: string; // e.g. "The Glasshouse"
  imageUrl: string | null;
  status: EventStatus;
  isLive: boolean; // true while the event is happening (show the LIVE badge)
};

export type TierRow = {
  id: string;
  name: string;
  sold: number; // TicketTier.quantitySold
  capacity: number; // TicketTier.quantity
  grossCents: number;
};

export type DailySales = { label: string; count: number };

// ---- Create event form ----
export type TierInput = { key: string; name: string; price: string; quantity: string };

export type EventFormValues = {
  title: string;
  description: string;
  category: string;
  date: string; // yyyy-mm-dd
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  venue: string;
  city: string;
  imageUrl: string;
  rewardBadges: boolean;
  tiers: TierInput[];
};

// What the form hands to your server action. Prices are already in cents.
export type EventPayload = {
  title: string;
  description: string;
  category: string;
  venue: string;
  city: string;
  imageUrl: string | null;
  startsAt: string; // ISO string
  endsAt: string; // ISO string
  rewardBadges: boolean;
  tiers: { name: string; priceCents: number; quantity: number }[];
};

// ---- Door check-in ----
export type ScanResult =
  | { kind: "success"; name: string; tierName: string; quantity: number; ticketCode: string; timeLabel: string; badgeUnlocked?: string }
  | { kind: "already-used"; name: string; ticketCode: string; usedAtLabel: string }
  | { kind: "wrong-event"; ticketCode: string }
  | { kind: "invalid"; ticketCode?: string };

// ---- Organizer events list ----
export type OrganizerEventRow = {
  id: string;
  title: string;
  venueLabel: string; // e.g. "The Glasshouse · Brooklyn, NY"
  dateLabel: string; // e.g. "Oct 23, 2026"
  timeLabel: string; // e.g. "7:00 PM"
  status: EventStatus;
  sold: number;
  capacity: number;
};
