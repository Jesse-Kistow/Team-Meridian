"use server";

import { revalidatePath } from "next/cache";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function updateName(
  name: string
): Promise<{ ok: boolean; error?: string }> {
  const { isAuthenticated, userId } = await auth();
  if (!isAuthenticated || !userId) {
    return { ok: false, error: "You need to be signed in." };
  }

  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 80) {
    return { ok: false, error: "Name must be 2 to 80 characters." };
  }

  const [firstName, ...rest] = trimmed.split(/\s+/);

  try {
    const client = await clerkClient();
    await client.users.updateUser(userId, {
      firstName,
      lastName: rest.join(" "),
    });
    await prisma.user.updateMany({
      where: { clerkId: userId },
      data: { name: trimmed },
    });
    revalidatePath("/profile");
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't save your name. Try again." };
  }
}