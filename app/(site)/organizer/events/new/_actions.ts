"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentOrganizer } from "@/lib/events/organizer-data";
import { parseEventInput } from "@/lib/events/validation";
import type { EventPayload } from "@/components/organizer/types";

export type CreateEventResult = { ok: false; errors: string[] };

async function createEvent(payload: EventPayload, status: "DRAFT" | "PUBLISHED"): Promise<CreateEventResult> {
  const organizer = await getCurrentOrganizer();
  if (!organizer) return { ok: false, errors: ["Only organizers can create events."] };

  // The browser can send anything, so validate again on the server
  const parsed = parseEventInput(payload, { requireTiers: status === "PUBLISHED" });
  if (!parsed.ok) return parsed;
  const { tiers, ...event } = parsed.data;

  let eventId: string;
  try {
    const created = await prisma.event.create({
      data: {
        ...event,
        status,
        organizerId: organizer.id,
        tiers: { create: tiers },
      },
      select: { id: true },
    });
    eventId = created.id;
  } catch (err) {
    console.error("createEvent failed", err);
    return { ok: false, errors: ["Couldn't save the event. Please try again."] };
  }

  revalidatePath("/organizer/events");
  if (status === "PUBLISHED") revalidatePath("/events");
  redirect(`/organizer/events/${eventId}`);
}

/** US-201: saves the event as a Draft (hidden from the public). */
export async function saveEventDraft(payload: EventPayload) {
  return createEvent(payload, "DRAFT");
}

/** Saves and publishes in one step. Publishing needs at least one ticket tier. */
export async function publishEvent(payload: EventPayload) {
  return createEvent(payload, "PUBLISHED");
}
