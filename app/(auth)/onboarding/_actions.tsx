"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";

type Role = "ATTENDEE" | "ORGANIZER";

export async function completeOnboarding(
  role: Role
): Promise<{ ok: boolean; error?: string }> {
  const { isAuthenticated, userId } = await auth();
  if (!isAuthenticated || !userId) {
    return { ok: false, error: "You need to be signed in." };
  }

  // The browser can send anything, so check the value here
  if (role !== "ATTENDEE" && role !== "ORGANIZER") {
    return { ok: false, error: "Please choose an account type." };
  }

  try {
    const client = await clerkClient();
    await client.users.updateUserMetadata(userId, {
      publicMetadata: { onboardingComplete: true, role },
    });
    return { ok: true };
  } catch {
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}