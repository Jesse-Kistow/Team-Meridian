import { Suspense } from "react";
import { getCurrentDbUser } from "@/lib/current-user";
import AttendeeProfile from "@/components/profile/AttendeeProfile";
import OrganizerProfile from "@/components/profile/OrganizerProfile";

async function ProfileView() {
  const user = await getCurrentDbUser();
  if (!user) return null;

  return user.role === "ORGANIZER" ? (
    <OrganizerProfile user={user} />
  ) : (
    <AttendeeProfile user={user} />
  );
}

export default function Page() {
  return (
    <Suspense>
      <ProfileView />
    </Suspense>
  );
}