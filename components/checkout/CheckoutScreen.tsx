"use client";

import { useState } from "react";
import Link from "next/link";
import { formatMoney } from "../organizer/format";

export type CheckoutTier = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  remaining: number; // quantity - quantitySold
};

type Props = {
  event: { id: string; title: string; dateLabel: string; locationLabel: string; imageUrl: string | null };
  tiers: CheckoutTier[];
  /** Display-only estimate (0.1 = 10%). The server must recompute the real total. */
  serviceFeeRate?: number;
  /** Max tickets per order. */
  maxPerOrder?: number;
  /** Server action: create the PENDING order + Stripe session and redirect. Receives tier id and quantity. */
  onCheckout?: (tierId: string, quantity: number) => void | Promise<void>;
  pending?: boolean;
  /** Error from the server (e.g. "Only 2 tickets left"). */
  errorMessage?: string | null;
  backHref?: string;
  helpHref?: string;
};

export default function CheckoutScreen({
  event,
  tiers,
  serviceFeeRate = 0.1,
  maxPerOrder = 10,
  onCheckout,
  pending = false,
  errorMessage = null,
  backHref,
  helpHref = "mailto:support@example.com",
}: Props) {
  const firstAvailable = tiers.find((t) => t.remaining > 0)?.id ?? null;
  const [tierId, setTierId] = useState<string | null>(firstAvailable);
  const [qty, setQty] = useState(1);

  const tier = tiers.find((t) => t.id === tierId) ?? null;
  const max = tier ? Math.max(1, Math.min(tier.remaining, maxPerOrder)) : 1;
  const quantity = Math.min(qty, max);
  const subtotal = tier ? tier.priceCents * quantity : 0;
  const fee = Math.round(subtotal * serviceFeeRate);
  const total = subtotal + fee;

  return (
    <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-7 px-4 py-8 sm:px-8 lg:px-16">
      <Link href={backHref ?? `/events/${event.id}`} className="text-[13px] text-[#79747F] hover:text-[#211E29]">
        ← {event.title} / Select tickets
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-6">
        <div className="flex flex-col gap-2.5">
          <p className="text-[11px] font-extrabold tracking-wide text-[#713EFF]">SECURE CHECKOUT</p>
          <h1 className="text-3xl font-extrabold text-[#211E29] sm:text-4xl">Make it a night.</h1>
        </div>
        <span className="rounded-full bg-[#EEE7FF] px-3 py-[7px] text-[11px] font-bold text-[#713EFF]">1 / Choose a tier &amp; purchase</span>
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            {event.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={event.imageUrl} alt="" className="h-20 w-20 shrink-0 rounded-[20px] object-cover" />
            ) : (
              <div className="h-20 w-20 shrink-0 rounded-[20px] bg-gradient-to-br from-[#EEE7FF] to-[#B598FF]" />
            )}
            <div className="min-w-0">
              <p className="text-[21px] font-extrabold text-[#211E29]">{event.title}</p>
              <p className="text-[13px] text-[#79747F]">{event.dateLabel}</p>
              <p className="text-[13px] text-[#79747F]">{event.locationLabel}</p>
            </div>
          </div>
          <hr className="border-[#E5E1E8]" />
          <h2 className="text-[23px] font-extrabold text-[#211E29]">Choose your ticket</h2>

          <div role="radiogroup" aria-label="Ticket tier" className="flex flex-col gap-3.5">
            {tiers.length === 0 && <p className="text-sm text-[#79747F]">Tickets aren&apos;t on sale for this event yet.</p>}
            {tiers.map((t) => {
              const soldOut = t.remaining <= 0;
              const selected = t.id === tierId;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={soldOut}
                  onClick={() => {
                    setTierId(t.id);
                    setQty(1);
                  }}
                  className={`flex items-center gap-[18px] rounded-[14px] p-6 text-left ${soldOut ? "cursor-not-allowed border border-[#E5E1E8] bg-white opacity-50" : selected ? "border-[1.5px] border-[#713EFF] bg-[#EEE7FF]" : "border border-[#E5E1E8] bg-white hover:border-[#B598FF]"}`}
                >
                  <span className={`h-[22px] w-[22px] shrink-0 rounded-full bg-white ${selected ? "border-[7px] border-[#713EFF]" : "border border-[#79747F]"}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[17px] font-bold text-[#211E29]">{t.name}</span>
                    {t.description && <span className="block text-[13px] text-[#79747F]">{t.description}</span>}
                  </span>
                  <span className="flex flex-col items-end">
                    <span className="text-[25px] font-extrabold text-[#211E29]">{t.priceCents === 0 ? "Free" : formatMoney(t.priceCents)}</span>
                    <span className={`text-[11px] ${soldOut ? "text-[#79747F]" : "text-[#713EFF]"}`}>
                      {soldOut ? "Sold out" : t.remaining <= 10 ? `Only ${t.remaining} left` : "per person"}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between p-5">
            <span className="text-[15px] font-bold text-[#211E29]">Quantity</span>
            <div className="flex items-center gap-6">
              <button
                type="button"
                aria-label="Decrease quantity"
                disabled={quantity <= 1}
                onClick={() => setQty(quantity - 1)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E5E1E8] text-xl text-[#713EFF] disabled:opacity-30"
              >
                −
              </button>
              <span aria-live="polite" className="w-5 text-center text-lg font-bold text-[#211E29]">{quantity}</span>
              <button
                type="button"
                aria-label="Increase quantity"
                disabled={quantity >= max || !tier}
                onClick={() => setQty(quantity + 1)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E5E1E8] text-xl text-[#713EFF] disabled:opacity-30"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-[22px]">
          <section className="flex flex-col gap-[22px] rounded-[20px] border border-[#E5E1E8] bg-white p-6 sm:p-7">
            <h2 className="text-[23px] font-extrabold text-[#211E29]">Order summary</h2>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#79747F]">{tier ? `${tier.name} × ${quantity}` : "No ticket selected"}</span>
              <span className="font-semibold text-[#211E29]">{formatMoney(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#79747F]">Service fee</span>
              <span className="font-semibold text-[#211E29]">{formatMoney(fee)}</span>
            </div>
            <hr className="border-[#E5E1E8]" />
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-[#211E29]">Total · USD</span>
              <span className="text-[26px] font-extrabold text-[#211E29]">{formatMoney(total)}</span>
            </div>
            <hr className="border-[#E5E1E8]" />
            <div className="flex flex-col gap-2">
              <p className="text-xs font-bold text-[#79747F]">PAYMENT METHOD</p>
              <p className="text-sm text-[#211E29]">You&apos;ll enter your card on Stripe&apos;s secure page next.</p>
            </div>
            {errorMessage && (
              <p role="alert" className="rounded-xl border border-[#F2B8B5] bg-[#FBE9E7] p-3 text-[13px] text-[#8C1D18]">
                {errorMessage}
              </p>
            )}
            <button
              type="button"
              disabled={!tier || pending}
              onClick={() => tier && void onCheckout?.(tier.id, quantity)}
              className="h-[50px] rounded-xl bg-[#713EFF] text-sm font-bold text-white hover:bg-[#5F2FE6] disabled:opacity-50"
            >
              {pending ? "Redirecting…" : total === 0 ? "Get ticket ↗" : `Pay ${formatMoney(total)} ↗`}
            </button>
            <p className="text-center text-[11px] text-[#79747F]">🔒 Secure checkout</p>
          </section>
          <p className="text-center text-xs text-[#79747F]">Your QR ticket arrives instantly.</p>
          <a href={helpHref} className="text-center text-[13px] font-semibold text-[#713EFF] hover:underline">Need help with your order?</a>
        </div>
      </div>
    </div>
  );
}
