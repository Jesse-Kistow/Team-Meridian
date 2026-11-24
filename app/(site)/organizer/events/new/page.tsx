import CreateEventForm from "@/components/organizer/CreateEventForm";

// UI only for now. Wiring (next step): pass server actions as onSaveDraft / onPublish
// that create the Event + TicketTier rows with Prisma (see the payload type in types.ts).
export default function NewEventPage() {
  return <CreateEventForm />;
}
