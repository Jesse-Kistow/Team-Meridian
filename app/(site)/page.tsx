import { redirect } from "next/navigation";

// The home page is the Discover page.
export default function Home() {
  redirect("/events");
}
