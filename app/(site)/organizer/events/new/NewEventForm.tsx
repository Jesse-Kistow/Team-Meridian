"use client";

import { useState, useTransition } from "react";
import CreateEventForm from "@/components/organizer/CreateEventForm";
import type { EventPayload } from "@/components/organizer/types";
import { publishEvent, saveEventDraft, type CreateEventResult } from "./_actions";

type Action = (payload: EventPayload) => Promise<CreateEventResult>;

export default function NewEventForm({ eyebrow }: { eyebrow?: string }) {
  const [pending, startTransition] = useTransition();
  const [serverErrors, setServerErrors] = useState<string[]>([]);

  // On success the action redirects to the new event's dashboard, so it only returns on failure
  const run = (action: Action) => (payload: EventPayload) =>
    startTransition(async () => {
      setServerErrors([]);
      const result = await action(payload);
      if (result && !result.ok) setServerErrors(result.errors);
    });

  return (
    <CreateEventForm
      eyebrow={eyebrow}
      pending={pending}
      serverErrors={serverErrors}
      onSaveDraft={run(saveEventDraft)}
      onPublish={run(publishEvent)}
    />
  );
}
