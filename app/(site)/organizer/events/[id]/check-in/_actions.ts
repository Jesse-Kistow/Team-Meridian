"use server";

import { revalidatePath } from "next/cache";
import { getCurrentDbUser } from "@/lib/current-user";
import { admitTicket, findAttendees, getCheckInCounts, getOwnedEvent, type AttendeeMatch, type TicketRef } from "@/lib/checkin/check-in";
import { cleanScannedCode, MAX_INPUT_LENGTH } from "@/lib/checkin/lookup";
import type { ScanResult } from "@/components/organizer/types";

type Forbidden = { ok: false; status: 403; error: string };
export type CheckInResponse = { ok: true; result: ScanResult; checkedIn: number } | Forbidden;
export type SearchResponse = { ok: true; matches: AttendeeMatch[] } | Forbidden;

const FORBIDDEN: Forbidden = { ok: false, status: 403, error: "You can only check people in to your own events." };

/** The signed-in organizer, if they own this event. Never trust the client for this. */
async function authorize(eventId: unknown) {
  if (typeof eventId !== "string" || !eventId) return null;
  const me = await getCurrentDbUser();
  if (!me || me.role !== "ORGANIZER") return null;
  const event = await getOwnedEvent(eventId, me.id);
  return event ? { me, event } : null;
}

async function admit(ref: TicketRef | null, eventId: string): Promise<CheckInResponse> {
  const auth = await authorize(eventId);
  if (!auth) return FORBIDDEN;
  // A value that can't be a ticket is simply "invalid", but only after the owner check
  const result: ScanResult = ref ? await admitTicket(ref, auth.event.id, auth.me.id) : { kind: "invalid" };
  if (result.kind === "success") revalidatePath(`/organizer/events/${auth.event.id}`);
  const { checkedIn } = await getCheckInCounts(auth.event.id);
  return { ok: true, result, checkedIn };
}

/** US-701/702: a scanned QR code (the ticket's secret `code`). */
export async function checkInTicket(code: string, eventId: string): Promise<CheckInResponse> {
  const clean = cleanScannedCode(code);
  return admit(clean ? { code: clean } : null, eventId);
}

/** US-705: admit a ticket picked from the manual search results. */
export async function checkInTicketById(ticketId: string, eventId: string): Promise<CheckInResponse> {
  const clean = cleanScannedCode(ticketId);
  return admit(clean ? { ticketId: clean } : null, eventId);
}

/** US-705: find this event's attendees by name, email or short ticket code. */
export async function searchAttendees(query: string, eventId: string): Promise<SearchResponse> {
  const auth = await authorize(eventId);
  if (!auth) return FORBIDDEN;
  if (typeof query !== "string") return { ok: true, matches: [] };
  return { ok: true, matches: await findAttendees(auth.event.id, query.slice(0, MAX_INPUT_LENGTH)) };
}
