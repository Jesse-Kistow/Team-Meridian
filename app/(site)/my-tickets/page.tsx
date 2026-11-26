import { Suspense } from "react";
import { redirect } from "next/navigation";
import MyTickets from "@/components/tickets/MyTickets";
import { getCurrentDbUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { toMyTickets } from "@/lib/tickets/my-tickets";

// US-602 / US-604: the signed-in user's tickets, split into upcoming and past.
async function MyTicketsContent() {
  const me = await getCurrentDbUser();
  if (!me) redirect("/sign-in");

  const tickets = await prisma.ticket.findMany({
    where: { ownerId: me.id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      status: true,
      orderId: true,
      order: { select: { status: true } },
      tier: { select: { id: true, name: true } },
      event: {
        select: { id: true, title: true, venue: true, city: true, imageUrl: true, startsAt: true, endsAt: true, status: true },
      },
    },
  });

  const { upcoming, past } = toMyTickets(tickets, me.name, new Date());
  return <MyTickets upcoming={upcoming} past={past} />;
}

// Reading the signed-in user needs a <Suspense> boundary under Cache Components.
export default function MyTicketsPage() {
  return (
    <Suspense fallback={<p className="px-4 py-12 text-center text-sm text-[#79747F]">Loading your tickets…</p>}>
      <MyTicketsContent />
    </Suspense>
  );
}
