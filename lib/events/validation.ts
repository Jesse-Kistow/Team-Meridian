// Server-side checks for the Create Event payload. The form validates too, but a
// server action can be called with anything, so we check again here.
// Pure (no Prisma, no Next) so it can be unit tested.

export type EventInput = {
  title: string;
  description: string;
  category: string;
  venue: string;
  city: string;
  imageUrl: string | null;
  startsAt: Date;
  endsAt: Date;
  tiers: { name: string; priceCents: number; quantity: number }[];
};

export type ParseResult = { ok: true; data: EventInput } | { ok: false; errors: string[] };

const LIMITS = { title: 120, description: 5000, category: 60, venue: 120, city: 120, tierName: 60, imageUrl: 2048 };
const MAX_TIERS = 20;
const MAX_PRICE_CENTS = 10_000_00; // $10,000 per ticket
const MAX_QUANTITY = 100_000;

function text(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function requiredText(input: Record<string, unknown>, key: keyof typeof LIMITS, label: string, errors: string[]): string {
  const value = text(input[key]);
  if (!value) errors.push(`${label} is required.`);
  else if (value.length > LIMITS[key]) errors.push(`${label} must be ${LIMITS[key]} characters or fewer.`);
  return value;
}

function parseDate(v: unknown): Date | null {
  if (typeof v !== "string" && !(v instanceof Date)) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Validates an event payload. `requireTiers` is true when publishing: a published
 * event must have at least one ticket tier to sell. Drafts may have none yet.
 */
export function parseEventInput(raw: unknown, { requireTiers }: { requireTiers: boolean }): ParseResult {
  if (!raw || typeof raw !== "object") return { ok: false, errors: ["Invalid event data."] };
  const input = raw as Record<string, unknown>;
  const errors: string[] = [];

  const title = requiredText(input, "title", "Event name", errors);
  const description = requiredText(input, "description", "Description", errors);
  const category = requiredText(input, "category", "Category", errors);
  const venue = requiredText(input, "venue", "Venue", errors);
  const city = requiredText(input, "city", "City", errors);

  let imageUrl: string | null = text(input.imageUrl) || null;
  if (imageUrl) {
    let valid = false;
    try {
      const u = new URL(imageUrl);
      valid = (u.protocol === "https:" || u.protocol === "http:") && imageUrl.length <= LIMITS.imageUrl;
    } catch {
      valid = false;
    }
    if (!valid) {
      errors.push("Image URL must be a valid http(s) link.");
      imageUrl = null;
    }
  }

  const startsAt = parseDate(input.startsAt);
  const endsAt = parseDate(input.endsAt);
  if (!startsAt || !endsAt) errors.push("Date, start time and end time are required.");
  else if (endsAt <= startsAt) errors.push("End time must be after the start time.");

  const tiers: EventInput["tiers"] = [];
  const rawTiers = Array.isArray(input.tiers) ? input.tiers : [];
  if (rawTiers.length > MAX_TIERS) errors.push(`An event can have at most ${MAX_TIERS} ticket tiers.`);
  rawTiers.slice(0, MAX_TIERS).forEach((t, i) => {
    const tier = (t && typeof t === "object" ? t : {}) as Record<string, unknown>;
    const name = text(tier.name);
    const label = name || `Tier ${i + 1}`;
    const priceCents = tier.priceCents;
    const quantity = tier.quantity;
    if (!name) errors.push(`Tier ${i + 1}: name is required.`);
    else if (name.length > LIMITS.tierName) errors.push(`${label}: name must be ${LIMITS.tierName} characters or fewer.`);
    else if (typeof priceCents !== "number" || !Number.isInteger(priceCents) || priceCents < 0 || priceCents > MAX_PRICE_CENTS)
      errors.push(`${label}: price must be between $0 and $10,000.`);
    else if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY)
      errors.push(`${label}: quantity must be a whole number from 1 to ${MAX_QUANTITY.toLocaleString("en-US")}.`);
    else tiers.push({ name, priceCents, quantity });
  });
  if (requireTiers && rawTiers.length === 0) errors.push("Add at least one ticket tier before publishing.");

  if (errors.length || !startsAt || !endsAt) return { ok: false, errors };
  return { ok: true, data: { title, description, category, venue, city, imageUrl, startsAt, endsAt, tiers } };
}
