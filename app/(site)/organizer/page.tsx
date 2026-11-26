import { redirect } from "next/navigation";

// The organizer home is "My Events" (the navbar links there directly).
export default function OrganizerPage() {
  redirect("/organizer/events");
}
