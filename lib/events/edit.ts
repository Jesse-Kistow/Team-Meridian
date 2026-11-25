// Rules for editing an existing event (US-202, US-204). Pure (no Prisma, no Next)
// so they can be unit tested. The server action applies the plan in a transaction.

import type { EventStatus } from "../../components/organizer/types";

export type ExistingTier = {
  id: string;
  name: string;
  quantity: number;
  quantitySold: number;
  /** True if any order (paid, pending or not) points at this tier. Such a tier can't be deleted. */
  hasOrders: boolean;
};

export type IncomingTier = { id?: string; name: string; priceCents: number; quantity: number };

export type TierPlan = {
  create: { name: string; priceCents: number; quantity: number }[];
  update: { id: string; name: string; priceCents: number; quantity: number; minQuantity: number }[];
  remove: { id: string; name: string }[];
};

export type PlanResult = { ok: true; plan: TierPlan } | { ok: false; errors: string[] };

/**
 * Works out which tiers to create, update and delete when an organizer saves the edit form.
 * - Tiers with an `id` must already belong to this event.
 * - Quantity can't go below what has already been sold (or is held by a pending checkout).
 * - A tier with sales or orders can't be removed.
 */
export function planTierChanges(existing: ExistingTier[], incoming: IncomingTier[]): PlanResult {
  const errors: string[] = [];
  const byId = new Map(existing.map((t) => [t.id, t]));
  const seen = new Set<string>();
  const plan: TierPlan = { create: [], update: [], remove: [] };

  for (const t of incoming) {
    if (t.id === undefined) {
      plan.create.push({ name: t.name, priceCents: t.priceCents, quantity: t.quantity });
      continue;
    }
    const current = byId.get(t.id);
    if (!current || seen.has(t.id)) {
      errors.push("A ticket tier on this page is out of date. Reload the page and try again.");
      continue;
    }
    seen.add(t.id);
    if (t.quantity < current.quantitySold) {
      errors.push(`${t.name}: ${current.quantitySold} tickets are already sold or reserved, so quantity can't be lower than that.`);
      continue;
    }
    plan.update.push({ id: t.id, name: t.name, priceCents: t.priceCents, quantity: t.quantity, minQuantity: current.quantitySold });
  }

  for (const t of existing) {
    if (seen.has(t.id)) continue;
    if (t.quantitySold > 0 || t.hasOrders) errors.push(`${t.name} can't be removed because tickets have already been ordered.`);
    else plan.remove.push({ id: t.id, name: t.name });
  }

  return errors.length ? { ok: false, errors: [...new Set(errors)] } : { ok: true, plan };
}

/** Whether an event in `current` status may be saved as `target`. Returns an error message or null. */
export function statusChangeError(current: EventStatus, target: "DRAFT" | "PUBLISHED", ticketsSold: number): string | null {
  if (current === "CANCELLED") return "Cancelled events can't be edited.";
  if (current === "PUBLISHED" && target === "DRAFT" && ticketsSold > 0) {
    return "People already have tickets, so this event can't go back to draft. Use Publish to save your changes.";
  }
  return null;
}

/** Splits a stored instant into the form's local date and time fields (in the browser's time zone). */
export function toFormDateTime(startsAt: Date, endsAt: Date): { date: string; startTime: string; endTime: string } {
  const pad = (n: number) => String(n).padStart(2, "0");
  const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const hm = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return { date: ymd(startsAt), startTime: hm(startsAt), endTime: hm(endsAt) };
}
