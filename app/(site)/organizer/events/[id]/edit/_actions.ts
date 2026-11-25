"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentOrganizer } from "@/lib/events/organizer-data";
import { parseEventInput } from "@/lib/events/validation";
import { planTierChanges, statusChangeError } from "@/lib/events/edit";
import type { EventPayload } from "@/components/organizer/types";

export type UpdateEventResult = { ok: false; errors: string[] };

// Thrown inside the transaction to roll it back with a message the organizer can act on.
class EditError extends Error {}

async function updateEvent(eventId: unknown, payload: EventPayload, status: "DRAFT" | "PUBLISHED"): Promise<UpdateEventResult> {
  const organizer = await getCurrentOrganizer();
  if (!organizer) return { ok: false, errors: ["Only organizers can edit events."] };
  if (typeof eventId !== "string" || !eventId) return { ok: false, errors: ["Event not found."] };

  // The browser can send anything, so validate again on the server
  const parsed = parseEventInput(payload, { requireTiers: status === "PUBLISHED" });
  if (!parsed.ok) return parsed;
  const { tiers: validTiers, ...fields } = parsed.data;

  // parseEventInput keeps tiers in the order they were sent, so the ids line up by index
  const rawTiers = Array.isArray(payload?.tiers) ? payload.tiers : [];
  const incoming = validTiers.map((t, i) => {
    const id = (rawTiers[i] as { id?: unknown } | undefined)?.id;
    return typeof id === "string" && id ? { ...t, id } : t;
  });

  try {
    await prisma.$transaction(async (tx) => {
      // Owner check: another organizer's event looks the same as a missing one
      const event = await tx.event.findFirst({
        where: { id: eventId, organizerId: organizer.id },
        select: {
          status: true,
          tiers: {
            select: { id: true, name: true, quantity: true, quantitySold: true, _count: { select: { orderItems: true } } },
          },
        },
      });
      if (!event) throw new EditError("Event not found.");

      const sold = event.tiers.reduce((s, t) => s + t.quantitySold, 0);
      const statusError = statusChangeError(event.status, status, sold);
      if (statusError) throw new EditError(statusError);

      const planned = planTierChanges(
        event.tiers.map((t) => ({ ...t, hasOrders: t._count.orderItems > 0 })),
        incoming,
      );
      if (!planned.ok) throw new EditError(planned.errors.join("\n"));
      const { plan } = planned;

      await tx.event.update({ where: { id: eventId }, data: { ...fields, status } });

      for (const t of plan.update) {
        // Re-check the sold count in the WHERE: a checkout may have reserved tickets since we read it
        const changed = await tx.ticketTier.updateMany({
          where: { id: t.id, eventId, quantitySold: { lte: t.quantity } },
          data: { name: t.name, priceCents: t.priceCents, quantity: t.quantity },
        });
        if (changed.count === 0) throw new EditError(`${t.name}: more tickets sold while you were editing. Reload and try again.`);
      }
      for (const t of plan.remove) {
        const removed = await tx.ticketTier.deleteMany({
          where: { id: t.id, eventId, quantitySold: 0, orderItems: { none: {} } },
        });
        if (removed.count === 0) throw new EditError(`${t.name} can't be removed because tickets have already been ordered.`);
      }
      if (plan.create.length) {
        await tx.ticketTier.createMany({ data: plan.create.map((t) => ({ ...t, eventId })) });
      }
    });
  } catch (err) {
    if (err instanceof EditError) return { ok: false, errors: err.message.split("\n") };
    console.error("updateEvent failed", err);
    return { ok: false, errors: ["Couldn't save the event. Please try again."] };
  }

  revalidatePath("/organizer/events");
  revalidatePath(`/organizer/events/${eventId}`);
  revalidatePath("/events");
  revalidatePath(`/events/${eventId}`);
  redirect(`/organizer/events/${eventId}`);
}

/** Saves the changes and keeps (or puts) the event in Draft. Not allowed once tickets are sold. */
export async function updateEventDraft(eventId: string, payload: EventPayload) {
  return updateEvent(eventId, payload, "DRAFT");
}

/** Saves the changes and publishes. Publishing needs at least one ticket tier. */
export async function updateEventPublish(eventId: string, payload: EventPayload) {
  return updateEvent(eventId, payload, "PUBLISHED");
}
