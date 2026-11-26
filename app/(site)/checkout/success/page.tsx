// app/(site)/checkout/success/page.tsx  Step 4: US-503
// Stripe sends the buyer here after paying. The webhook normally marks the order
// PAID first; if it hasn't yet, we ask Stripe directly so the buyer isn't left waiting.
import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { fulfillCheckoutSession, orderIdFromSession } from "@/lib/checkout";
import { getCurrentDbUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { formatMoney } from "@/components/organizer/format";

async function loadOrder(orderId: string, userId: string) {
  return prisma.order.findFirst({
    where: { id: orderId, userId },
    include: {
      event: { select: { id: true, title: true, venue: true, city: true } },
      items: { include: { tier: { select: { name: true } } } },
      _count: { select: { tickets: true } },
    },
  });
}

async function Result({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await getCurrentDbUser();
  if (!user) redirect("/sign-in");

  const { order: orderParam } = await searchParams;
  const orderId = typeof orderParam === "string" ? orderParam : null;
  if (!orderId) notFound();

  // Only the buyer can see their order
  let order = await loadOrder(orderId, user.id);
  if (!order) notFound();

  if (order.status === "PENDING" && order.stripeSessionId) {
    try {
      const session = await stripe.checkout.sessions.retrieve(order.stripeSessionId);
      if (orderIdFromSession(session) === order.id) {
        await fulfillCheckoutSession(session);
        order = (await loadOrder(orderId, user.id)) ?? order;
      }
    } catch (error) {
      // The webhook will still catch up; show the "processing" state meanwhile.
      console.error("Couldn't check the Stripe session", error);
    }
  }

  const ticketCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const summary = order.items.map((item) => `${item.quantity} × ${item.tier.name}`).join(", ");

  if (order.status === "PAID") {
    return (
      <Panel eyebrow="YOU'RE IN" title={`See you at ${order.event.title}!`}>
        <p className="text-[15px] text-[#4A4553]">
          {summary} · {formatMoney(order.totalCents)} paid. Your {ticketCount === 1 ? "ticket is" : `${ticketCount} tickets are`} ready.
        </p>
        <p className="text-[13px] text-[#79747F]">
          {order.event.venue}, {order.event.city}
        </p>
        <div className="flex flex-wrap gap-3">
          <PrimaryLink href="/my-tickets">View my tickets</PrimaryLink>
          <SecondaryLink href={`/events/${order.event.id}`}>Back to the event</SecondaryLink>
        </div>
      </Panel>
    );
  }

  if (order.status === "PENDING") {
    return (
      <Panel eyebrow="PAYMENT PROCESSING" title="Almost there…">
        <p className="text-[15px] text-[#4A4553]">
          We&apos;re waiting for your payment for {summary} to {order.event.title} to clear. Your tickets are held
          for you, and they&apos;ll show up in My Tickets as soon as it does.
        </p>
        <div className="flex flex-wrap gap-3">
          <PrimaryLink href={`/checkout/success?order=${order.id}`}>Check again</PrimaryLink>
          <SecondaryLink href="/my-tickets">My tickets</SecondaryLink>
        </div>
      </Panel>
    );
  }

  return (
    <Panel
      eyebrow={order.status === "REFUNDED" ? "REFUNDED" : "ORDER NOT COMPLETED"}
      title={order.status === "REFUNDED" ? "Those tickets sold out" : "This order didn't go through"}
    >
      <p className="text-[15px] text-[#4A4553]">
        {order.status === "REFUNDED"
          ? "Your payment arrived after your hold ran out and the tickets had gone to someone else, so we've refunded you in full."
          : "Your payment wasn't completed, so nothing was charged and the tickets were released."}
      </p>
      <div className="flex flex-wrap gap-3">
        <PrimaryLink href={`/events/${order.event.id}/checkout`}>Try again</PrimaryLink>
      </div>
    </Panel>
  );
}

function Panel({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-5 px-4 py-16 sm:px-8">
      <p className="text-[11px] font-extrabold tracking-wide text-[#713EFF]">{eyebrow}</p>
      <h1 className="text-3xl font-extrabold text-[#211E29] sm:text-4xl">{title}</h1>
      {children}
    </div>
  );
}

function PrimaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="rounded-xl bg-[#713EFF] px-5 py-3 text-sm font-bold text-white hover:bg-[#5F2EEB]">
      {children}
    </Link>
  );
}

function SecondaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="rounded-xl border border-[#E5E1E8] bg-white px-5 py-3 text-sm font-bold text-[#211E29] hover:border-[#B598FF]">
      {children}
    </Link>
  );
}

export default function CheckoutSuccessPage({ searchParams }: PageProps<"/checkout/success">) {
  return (
    <Suspense fallback={<p className="px-4 py-16 text-center text-sm text-[#79747F]">Confirming your order…</p>}>
      <Result searchParams={searchParams} />
    </Suspense>
  );
}
