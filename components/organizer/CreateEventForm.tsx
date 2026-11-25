"use client";

import { useState } from "react";
import Link from "next/link";
import { ImageIcon, PencilIcon, TrophyIcon, XIcon } from "./OrganizerIcons";
import { formatMoney } from "./format";
import type { EventFormValues, EventPayload, TierInput } from "./types";

type Props = {
  /** Pre-fill when editing an existing event. Leave out for a blank form. */
  initialValues?: Partial<EventFormValues>;
  /** Called with validated data when the organizer saves a draft / publishes. Pass server actions. */
  onSaveDraft?: (payload: EventPayload) => void | Promise<void>;
  onPublish?: (payload: EventPayload) => void | Promise<void>;
  /** Disable the buttons while a server action is running. */
  pending?: boolean;
  /** Errors returned by the server action, shown in the same box as the form's own checks. */
  serverErrors?: string[];
  /** Pill text next to the buttons, e.g. "DRAFT" or "DRAFT · AUTOSAVED". */
  statusLabel?: string;
  /** Where the breadcrumb and the cancel link go. */
  backHref?: string;
  /** Optional preview link, shown only when provided. */
  previewHref?: string;
  /** Shown above the title, e.g. the organization name. */
  eyebrow?: string;
};

let tierCounter = 0;
const newTier = (t?: Partial<TierInput>): TierInput => ({
  key: `tier-${++tierCounter}`,
  name: "",
  price: "",
  quantity: "",
  ...t,
});

const blank: EventFormValues = {
  title: "",
  description: "",
  category: "",
  date: "",
  startTime: "",
  endTime: "",
  venue: "",
  city: "",
  imageUrl: "",
  rewardBadges: true,
  tiers: [],
};

const inputCls =
  "h-[52px] w-full rounded-xl border border-[#E5E1E8] bg-white px-4 text-sm text-[#211E29] placeholder:text-[#79747F] outline-none focus:border-[#713EFF] focus:ring-2 focus:ring-[#713EFF]/20";
const tierInputCls =
  "h-12 w-full rounded-[10px] border border-[#E5E1E8] bg-[#F7F5F1] px-3.5 text-sm text-[#211E29] outline-none focus:border-[#713EFF] focus:ring-2 focus:ring-[#713EFF]/20";
const cardCls = "rounded-[20px] border border-[#E5E1E8] bg-white p-6 sm:p-7";

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className="text-[13px] font-semibold text-[#211E29]">
        {label}
      </label>
      {children}
    </div>
  );
}

/** Turns the form into the payload for the server. Returns errors instead if something is wrong. */
export function buildPayload(v: EventFormValues): { payload?: EventPayload; errors: string[] } {
  const errors: string[] = [];
  if (!v.title.trim()) errors.push("Event name is required.");
  if (!v.description.trim()) errors.push("Add a short description.");
  if (!v.category.trim()) errors.push("Pick or type a category.");
  if (!v.venue.trim()) errors.push("Venue is required.");
  if (!v.city.trim()) errors.push("City is required.");
  if (!v.date || !v.startTime || !v.endTime) errors.push("Date, start time and end time are required.");

  let startsAt: Date | null = null;
  let endsAt: Date | null = null;
  if (v.date && v.startTime && v.endTime) {
    startsAt = new Date(`${v.date}T${v.startTime}`);
    endsAt = new Date(`${v.date}T${v.endTime}`);
    // An end time earlier than the start is treated as "after midnight".
    if (endsAt <= startsAt) endsAt = new Date(endsAt.getTime() + 24 * 60 * 60 * 1000);
  }

  const tiers: EventPayload["tiers"] = [];
  v.tiers.forEach((t, i) => {
    const price = Number(t.price);
    const qty = Number(t.quantity);
    if (!t.name.trim()) errors.push(`Tier ${i + 1}: name is required.`);
    else if (!Number.isFinite(price) || price < 0 || t.price === "") errors.push(`${t.name}: price must be 0 or more.`);
    else if (!Number.isInteger(qty) || qty < 1) errors.push(`${t.name}: quantity must be at least 1.`);
    else tiers.push({ name: t.name.trim(), priceCents: Math.round(price * 100), quantity: qty });
  });

  if (errors.length || !startsAt || !endsAt) return { errors };
  return {
    errors,
    payload: {
      title: v.title.trim(),
      description: v.description.trim(),
      category: v.category.trim(),
      venue: v.venue.trim(),
      city: v.city.trim(),
      imageUrl: v.imageUrl.trim() || null,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      rewardBadges: v.rewardBadges,
      tiers,
    },
  };
}

export default function CreateEventForm({
  initialValues,
  onSaveDraft,
  onPublish,
  pending = false,
  serverErrors = [],
  statusLabel = "DRAFT",
  backHref = "/organizer/events",
  previewHref,
  eyebrow = "NEW EVENT",
}: Props) {
  const [values, setValues] = useState<EventFormValues>(() => ({
    ...blank,
    ...initialValues,
    tiers: initialValues?.tiers?.length ? initialValues.tiers : [newTier()],
  }));
  const [errors, setErrors] = useState<string[]>([]);
  const [editingCover, setEditingCover] = useState(false);

  const set = <K extends keyof EventFormValues>(key: K, value: EventFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));
  const setTier = (key: string, patch: Partial<TierInput>) =>
    setValues((v) => ({ ...v, tiers: v.tiers.map((t) => (t.key === key ? { ...t, ...patch } : t)) }));

  // The form's own checks run first; server errors only show once those pass.
  const shownErrors = errors.length > 0 ? errors : serverErrors;

  const totalTickets = values.tiers.reduce((s, t) => s + (Number(t.quantity) || 0), 0);
  const potentialCents = values.tiers.reduce(
    (s, t) => s + Math.round((Number(t.price) || 0) * 100) * (Number(t.quantity) || 0),
    0,
  );

  async function submit(handler?: (p: EventPayload) => void | Promise<void>) {
    const { payload, errors } = buildPayload(values);
    setErrors(errors);
    if (payload) await handler?.(payload);
  }

  return (
    <form
      className="mx-auto flex w-full max-w-[1280px] flex-col gap-7 px-4 py-8 sm:px-8 lg:px-16"
      onSubmit={(e) => {
        e.preventDefault();
        void submit(onPublish);
      }}
      noValidate
    >
      <Link href={backHref} className="text-[13px] text-[#79747F] hover:text-[#211E29]">
        ← Ticket &amp; event management / Create an event
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-6">
        <div className="flex flex-col gap-2.5">
          <p className="text-[11px] font-extrabold tracking-wide text-[#713EFF]">{eyebrow}</p>
          <h1 className="text-3xl font-extrabold text-[#211E29] sm:text-4xl">Create an event</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-[#EEE7FF] px-3 py-[7px] text-[11px] font-bold text-[#713EFF]">{statusLabel}</span>
          <button
            type="button"
            disabled={pending}
            onClick={() => void submit(onSaveDraft)}
            className="h-[50px] rounded-xl bg-[#EEE7FF] px-5 text-sm font-bold text-[#713EFF] hover:bg-[#E2D6FF] disabled:opacity-60"
          >
            Save draft
          </button>
          {previewHref ? (
            <Link
              href={previewHref}
              className="flex h-[50px] items-center rounded-xl bg-[#EEE7FF] px-5 text-sm font-bold text-[#713EFF] hover:bg-[#E2D6FF]"
            >
              Preview event ↗
            </Link>
          ) : null}
          <button
            type="submit"
            disabled={pending}
            className="h-[50px] rounded-xl bg-[#713EFF] px-5 text-sm font-bold text-white hover:bg-[#5F2FE6] disabled:opacity-60"
          >
            {pending ? "Saving…" : "Publish event ↗"}
          </button>
        </div>
      </div>

      {shownErrors.length > 0 && (
        <div role="alert" className="rounded-xl border border-[#F2B8B5] bg-[#FBE9E7] p-4 text-sm text-[#8C1D18]">
          <p className="mb-1 font-bold">Fix these before continuing:</p>
          <ul className="list-disc pl-5">
            {shownErrors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-9 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* Left column */}
        <div className="flex flex-col gap-6">
          <section className={`${cardCls} flex flex-col gap-[22px]`}>
            <h2 className="text-[22px] font-extrabold text-[#211E29]">Event details</h2>
            <Field label="Event name" htmlFor="title">
              <input id="title" className={inputCls} value={values.title} onChange={(e) => set("title", e.target.value)} placeholder="After Hours: Vol. 02" />
            </Field>
            <Field label="Description" htmlFor="description">
              <textarea
                id="description"
                rows={4}
                className={`${inputCls} h-auto py-3`}
                value={values.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="What should people expect?"
              />
            </Field>
            <Field label="Category" htmlFor="category">
              <input id="category" className={inputCls} value={values.category} onChange={(e) => set("category", e.target.value)} placeholder="Music, Technology, Food & Drink…" />
            </Field>
            <div className="grid gap-5 sm:grid-cols-3">
              <Field label="Date" htmlFor="date">
                <input id="date" type="date" className={inputCls} value={values.date} onChange={(e) => set("date", e.target.value)} />
              </Field>
              <Field label="Start time" htmlFor="startTime">
                <input id="startTime" type="time" className={inputCls} value={values.startTime} onChange={(e) => set("startTime", e.target.value)} />
              </Field>
              <Field label="End time" htmlFor="endTime">
                <input id="endTime" type="time" className={inputCls} value={values.endTime} onChange={(e) => set("endTime", e.target.value)} />
              </Field>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Venue" htmlFor="venue">
                <input id="venue" className={inputCls} value={values.venue} onChange={(e) => set("venue", e.target.value)} placeholder="The Glasshouse" />
              </Field>
              <Field label="City" htmlFor="city">
                <input id="city" className={inputCls} value={values.city} onChange={(e) => set("city", e.target.value)} placeholder="Brooklyn, NY" />
              </Field>
            </div>
          </section>

          <section className={`${cardCls} flex flex-col gap-[22px]`}>
            <div className="flex items-start justify-between">
              <h2 className="text-[22px] font-extrabold text-[#211E29]">Ticket tiers</h2>
              <button
                type="button"
                onClick={() => setValues((v) => ({ ...v, tiers: [...v.tiers, newTier()] }))}
                className="text-[13px] font-bold text-[#713EFF] hover:underline"
              >
                + Add tier
              </button>
            </div>

            <div className="grid grid-cols-[minmax(0,1fr)_88px_72px_28px] gap-3 text-[11px] text-[#79747F] sm:grid-cols-[minmax(0,1fr)_100px_88px_28px] sm:gap-4">
              <span>TIER NAME</span>
              <span>USD</span>
              <span>QTY</span>
              <span />
            </div>

            {values.tiers.map((t, i) => (
              <div key={t.key} className="grid grid-cols-[minmax(0,1fr)_88px_72px_28px] items-center gap-3 sm:grid-cols-[minmax(0,1fr)_100px_88px_28px] sm:gap-4">
                <input aria-label={`Tier ${i + 1} name`} className={`${tierInputCls} font-semibold`} value={t.name} onChange={(e) => setTier(t.key, { name: e.target.value })} placeholder="Early bird" />
                <input aria-label={`Tier ${i + 1} price in dollars`} inputMode="decimal" className={tierInputCls} value={t.price} onChange={(e) => setTier(t.key, { price: e.target.value })} placeholder="25" />
                <input aria-label={`Tier ${i + 1} quantity`} inputMode="numeric" className={tierInputCls} value={t.quantity} onChange={(e) => setTier(t.key, { quantity: e.target.value })} placeholder="50" />
                <button
                  type="button"
                  aria-label={`Remove tier ${i + 1}`}
                  disabled={values.tiers.length === 1}
                  onClick={() => setValues((v) => ({ ...v, tiers: v.tiers.filter((x) => x.key !== t.key) }))}
                  className="text-[#79747F] hover:text-[#211E29] disabled:opacity-30"
                >
                  <XIcon width={16} height={16} />
                </button>
              </div>
            ))}

            <hr className="border-[#E5E1E8]" />
            <p className="text-xs text-[#79747F]">
              {totalTickets} tickets total · {formatMoney(potentialCents)} potential gross sales
            </p>
          </section>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6">
          <section className={`${cardCls} flex flex-col gap-[22px]`}>
            <div className="flex items-start justify-between">
              <h2 className="text-[22px] font-extrabold text-[#211E29]">Event cover</h2>
              <ImageIcon className="text-[#713EFF]" />
            </div>
            <div className="flex h-[250px] items-center justify-center overflow-hidden rounded-[20px] bg-[#EEE7FF] text-[#713EFF]">
              {values.imageUrl.trim() ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={values.imageUrl} alt="Event cover preview" className="h-full w-full object-cover" />
              ) : (
                <ImageIcon width={40} height={40} />
              )}
            </div>
            <button
              type="button"
              onClick={() => setEditingCover((x) => !x)}
              className="flex h-[50px] items-center justify-center gap-2 rounded-xl bg-[#EEE7FF] text-sm font-bold text-[#713EFF] hover:bg-[#E2D6FF]"
            >
              <PencilIcon width={16} height={16} /> Edit cover
            </button>
            {editingCover && (
              <Field label="Image URL" htmlFor="imageUrl">
                <input id="imageUrl" type="url" className={inputCls} value={values.imageUrl} onChange={(e) => set("imageUrl", e.target.value)} placeholder="https://…" />
              </Field>
            )}
            <p className="text-[13px] text-[#79747F]">
              {values.title || "Untitled event"}
              {values.date ? ` · ${values.date}` : ""}
            </p>
          </section>

          <section className={`${cardCls} flex items-center gap-3.5`}>
            <TrophyIcon width={26} height={26} className="shrink-0 text-[#713EFF]" />
            <div className="flex-1">
              <p className="text-[15px] font-bold text-[#211E29]">Reward a night well spent</p>
              <p className="text-xs text-[#79747F]">Check-ins count toward badges</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={values.rewardBadges}
              aria-label="Reward attendees with badges"
              onClick={() => set("rewardBadges", !values.rewardBadges)}
              className={`flex h-[26px] w-11 shrink-0 items-center rounded-full p-[3px] transition-colors ${values.rewardBadges ? "justify-end bg-[#713EFF]" : "justify-start bg-[#CFCAD6]"}`}
            >
              <span className="h-5 w-5 rounded-full bg-white" />
            </button>
          </section>
        </div>
      </div>
    </form>
  );
}
