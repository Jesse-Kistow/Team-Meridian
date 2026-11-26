// Shared display helpers for tickets. Pure, no Prisma or Next imports.

// Events don't store a time zone yet, so all labels use this one (same as the organizer screens).
export const DISPLAY_TIME_ZONE = "America/New_York";

/**
 * Short code printed on a ticket, e.g. "EA-K3J9QZ". Built from the ticket's row id,
 * so it's stable and easy to read out at the door. It is NOT the secret `Ticket.code`
 * (that one goes in the QR code and is never shown as text).
 */
export function shortTicketCode(ticketId: string): string {
  return `EA-${ticketId.slice(-6).toUpperCase()}`;
}

export const fmt = (d: Date, options: Intl.DateTimeFormatOptions, timeZone = DISPLAY_TIME_ZONE) =>
  d.toLocaleString("en-US", { timeZone, ...options });

/** "Fri, Oct 23, 2026" */
export const dayLabel = (d: Date, timeZone = DISPLAY_TIME_ZONE) =>
  fmt(d, { weekday: "short", month: "short", day: "numeric", year: "numeric" }, timeZone);

/** "7:00 PM" */
export const timeLabel = (d: Date, timeZone = DISPLAY_TIME_ZONE) => fmt(d, { hour: "numeric", minute: "2-digit" }, timeZone);
