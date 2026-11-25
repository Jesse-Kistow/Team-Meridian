"use client";

import { useState, useSyncExternalStore, useTransition } from "react";
import CreateEventForm from "@/components/organizer/CreateEventForm";
import type { EventFormValues, EventPayload } from "@/components/organizer/types";
import { toFormDateTime } from "@/lib/events/edit";
import { updateEventDraft, updateEventPublish, type UpdateEventResult } from "./_actions";

export type EditableEvent = {
  id: string;
  title: string;
  description: string;
  category: string;
  venue: string;
  city: string;
  imageUrl: string | null;
  startsAt: string; // ISO
  endsAt: string; // ISO
  status: "DRAFT" | "PUBLISHED" | "CANCELLED";
  tiers: { id: string; name: string; priceCents: number; quantity: number }[];
};

type Action = (eventId: string, payload: EventPayload) => Promise<UpdateEventResult>;

const subscribe = () => () => {};

export default function EditEventForm({ event, eyebrow }: { event: EditableEvent; eyebrow?: string }) {
  const [pending, startTransition] = useTransition();
  const [serverErrors, setServerErrors] = useState<string[]>([]);
  // The form's date and time fields are in the organizer's own time zone, which only the
  // browser knows. So the form renders after hydration, never with the server's zone.
  const isClient = useSyncExternalStore(subscribe, () => true, () => false);

  // On success the action redirects to the dashboard, so it only returns on failure
  const run = (action: Action) => (payload: EventPayload) =>
    startTransition(async () => {
      setServerErrors([]);
      const result = await action(event.id, payload);
      if (result && !result.ok) setServerErrors(result.errors);
    });

  if (!isClient) return <p className="px-4 py-12 text-center text-sm text-[#79747F]">Loading event…</p>;

  const initialValues: EventFormValues = {
    title: event.title,
    description: event.description,
    category: event.category,
    venue: event.venue,
    city: event.city,
    imageUrl: event.imageUrl ?? "",
    ...toFormDateTime(new Date(event.startsAt), new Date(event.endsAt)),
    rewardBadges: true, // not stored yet (no column)
    tiers: event.tiers.map((t) => ({
      key: t.id,
      id: t.id,
      name: t.name,
      price: (t.priceCents / 100).toFixed(2),
      quantity: String(t.quantity),
    })),
  };

  return (
    <CreateEventForm
      initialValues={initialValues}
      eyebrow={eyebrow ?? "EDIT EVENT"}
      statusLabel={event.status}
      backHref={`/organizer/events/${event.id}`}
      pending={pending}
      serverErrors={serverErrors}
      onSaveDraft={run(updateEventDraft)}
      onPublish={run(updateEventPublish)}
    />
  );
}
