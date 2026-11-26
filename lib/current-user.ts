import { currentUser } from "@clerk/nextjs/server";
import { Prisma } from "../generated/prisma/client";
import { prisma } from "@/lib/prisma";

const isUniqueViolation = (err: unknown) =>
  err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";

/**
 * Returns the DB user for the signed-in Clerk user, creating or linking it on first sight.
 *
 * Users are matched by clerkId first, then by email. Matching by email covers a Clerk account
 * that was deleted and signed up again (or a different Clerk instance) with the same email:
 * the existing row, with its orders and tickets, is re-linked to the new clerkId instead of
 * failing on the unique email.
 */
export async function getCurrentDbUser() {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email = clerkUser.primaryEmailAddress?.emailAddress;
  if (!email) return null;

  const clerkId = clerkUser.id;
  const role = clerkUser.publicMetadata?.role === "ORGANIZER" ? "ORGANIZER" : "ATTENDEE";
  const name = clerkUser.fullName ?? email.split("@")[0];

  const existing = await prisma.user.findUnique({ where: { clerkId } });
  if (existing) {
    try {
      return await prisma.user.update({ where: { id: existing.id }, data: { name, email, role } });
    } catch (err) {
      // The user changed their email in Clerk to one another row already has: keep the old email
      if (!isUniqueViolation(err)) throw err;
      return prisma.user.update({ where: { id: existing.id }, data: { name, role } });
    }
  }

  try {
    return await prisma.user.upsert({
      where: { email },
      update: { clerkId, name, role },
      create: { clerkId, name, email, role },
    });
  } catch (err) {
    // Two first requests raced to create the same user: the other one won, so read its row
    if (!isUniqueViolation(err)) throw err;
    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) throw err;
    return user;
  }
}
