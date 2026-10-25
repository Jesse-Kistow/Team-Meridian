import { Suspense } from "react";
import { UserProfile } from "@clerk/nextjs";
import { getCurrentDbUser } from "@/lib/current-user";

async function AccountSummary() {
  const dbUser = await getCurrentDbUser();
  if (!dbUser) return null;

  return (
    <div className="w-full max-w-3xl rounded-2xl border border-zinc-200 bg-white p-6">
      <p className="text-xs font-bold text-violet-600">YOUR ACCOUNT</p>
      <p className="mt-2 text-xl font-extrabold text-neutral-800">{dbUser.name}</p>
      <p className="text-sm text-zinc-500">{dbUser.email}</p>
      <p className="mt-2 text-sm font-semibold text-neutral-800">
        Account type: {dbUser.role === "ORGANIZER" ? "Organizer" : "Attendee"}
      </p>
    </div>
  );
}

export default function Page() {
  return (
    <div className="flex flex-col items-center gap-6 p-8">
      <Suspense>
        <AccountSummary />
      </Suspense>
      <Suspense>
        <UserProfile />
      </Suspense>
    </div>
  );
}