import NewEventForm from "./NewEventForm";

// Organizer-only: the middleware redirects everyone else, and the server actions
// check the role again before saving.
export default function NewEventPage() {
  return <NewEventForm />;
}
