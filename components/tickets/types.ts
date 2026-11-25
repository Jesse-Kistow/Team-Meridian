export type UpcomingTicket = {
  id: string;
  eventTitle: string;
  dateLabel: string; // "Fri, Oct 23, 2026 · 7:00 PM"
  locationLabel: string; // "The Glasshouse, Brooklyn"
  imageUrl: string | null;
  status: "CONFIRMED" | "CANCELLED";
  ticketCount: number; // tickets in this order for this event
  tierName: string;
  holderName: string;
  ticketCode: string; // shown as "Ticket EA-10482" (a short display code, NOT the secret QR value)
  href: string; // where "View ticket" goes
};

export type PastTicket = {
  id: string;
  month: string; // "OCT"
  day: string; // "04"
  title: string;
  locationLabel: string; // "Williamsburg, Brooklyn"
  dateLabel: string; // "Sun, Oct 4, 2026"
  timeLabel: string; // "6:00 PM · 1 ticket"
  outcome: "ATTENDED" | "MISSED" | "CANCELLED";
  href: string;
};

// ---- Single ticket page (/my-tickets/[id]) ----
export type TicketQr = {
  id: string;
  ticketCode: string; // short display code, e.g. "EA-K3J9QZ"
  /** PNG data URL of the QR (encodes the secret Ticket.code). null when the ticket can't be used. */
  qrDataUrl: string | null;
  state: "VALID" | "USED" | "CANCELLED" | "ENDED";
};

export type TicketDetailData = {
  eventId: string;
  eventTitle: string;
  dateLabel: string; // "Fri, Oct 23, 2026"
  timeLabel: string; // "7:00 PM – 11:00 PM"
  venue: string;
  city: string;
  imageUrl: string | null;
  tierName: string;
  holderName: string;
  /** All tickets bought together with this one (same order and tier); the opened one first. */
  tickets: TicketQr[];
};
