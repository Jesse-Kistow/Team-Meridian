import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import QRCode from "qrcode";
import TicketDetail from "@/components/tickets/TicketDetail";
import { getCurrentDbUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { dayLabel, shortTicketCode, timeLabel } from "@/lib/tickets/display";
import { showsQr, ticketState } from "@/lib/tickets/ticket-detail";

// US-601 / US-603: one ticket (and the others bought with it) with its QR code.
// Owner only: someone else's ticket id looks the same as a missing one (404).
async function TicketContent({ params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentDbUser();
  if (!me) redirect("/sign-in");

  const { id } = await params;
  const opened = await prisma.ticket.findFirst({
    where: { id, ownerId: me.id },
    select: { orderId: true, tierId: true },
  });
  if (!opened) notFound();

  // Tickets bought together show on one My Tickets card, so show them all here, opened one first
  const tickets = await prisma.ticket.findMany({
    where: { orderId: opened.orderId, tierId: opened.tierId, ownerId: me.id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      code: true,
      status: true,
      order: { select: { status: true } },
      tier: { select: { name: true } },
      event: { select: { id: true, title: true, venue: true, city: true, imageUrl: true, startsAt: true, endsAt: true, status: true } },
    },
  });
  tickets.sort((a, b) => Number(b.id === id) - Number(a.id === id));
  const { event, tier } = tickets[0];
  const now = new Date();

  const qrs = await Promise.all(
    tickets.map(async (t) => {
      const state = ticketState(
        { status: t.status, orderStatus: t.order.status, eventStatus: t.event.status, eventEndsAt: t.event.endsAt },
        now,
      );
      return {
        id: t.id,
        ticketCode: shortTicketCode(t.id),
        // The QR encodes the secret Ticket.code (what the door scanner looks up), never the id or short code
        qrDataUrl: showsQr(state) ? await QRCode.toDataURL(t.code, { errorCorrectionLevel: "M", margin: 1, width: 480 }) : null,
        state,
      };
    }),
  );

  return (
    <TicketDetail
      data={{
        eventId: event.id,
        eventTitle: event.title,
        dateLabel: dayLabel(event.startsAt),
        timeLabel: `${timeLabel(event.startsAt)} – ${timeLabel(event.endsAt)}`,
        venue: event.venue,
        city: event.city,
        imageUrl: event.imageUrl,
        tierName: tier.name,
        holderName: me.name,
        tickets: qrs,
      }}
    />
  );
}

// Reading the user and params needs a <Suspense> boundary under Cache Components.
export default function TicketPage({ params }: PageProps<"/my-tickets/[id]">) {
  return (
    <Suspense fallback={<p className="px-4 py-12 text-center text-sm text-[#79747F]">Loading your ticket…</p>}>
      <TicketContent params={params} />
    </Suspense>
  );
}
