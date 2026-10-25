import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function getCurrentDbUser() {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email = clerkUser.primaryEmailAddress?.emailAddress;
  if (!email) return null;

  const role = clerkUser.publicMetadata?.role === "ORGANIZER" ? "ORGANIZER" : "ATTENDEE";
  const name = clerkUser.fullName ?? email.split("@")[0];

  return prisma.user.upsert({
    where: { clerkId: clerkUser.id },
    update: { name, email, role },
    create: { clerkId: clerkUser.id, name, email, role },
  });
}