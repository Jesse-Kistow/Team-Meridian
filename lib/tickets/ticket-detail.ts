// Which state a single ticket is in for the QR page (US-601, US-603). Pure, so it's unit tested.
import type { TicketQr } from "../../components/tickets/types";

export type TicketStateInput = {
  status: "VALID" | "USED" | "CANCELLED";
  orderStatus: "PENDING" | "PAID" | "FAILED" | "CANCELLED" | "REFUNDED";
  eventStatus: "DRAFT" | "PUBLISHED" | "CANCELLED";
  eventEndsAt: Date;
};

export function ticketState(t: TicketStateInput, now: Date): TicketQr["state"] {
  if (t.status === "CANCELLED" || t.orderStatus === "REFUNDED" || t.eventStatus === "CANCELLED") return "CANCELLED";
  if (t.status === "USED") return "USED";
  if (t.eventEndsAt <= now) return "ENDED";
  return "VALID";
}

/** Only a ticket that can still get someone in shows its QR code. */
export const showsQr = (state: TicketQr["state"]) => state === "VALID";
