"use client";

// components/checkout/BuyTicketsForm.tsx  (NEW)  Step 2: US-501
import { useState, useTransition, type FormEvent } from "react";
import { startCheckout } from "@/app/(site)/checkout/_actions";

export type TierOption = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  remaining: number;
};

// Keep in step with MAX_TICKETS_PER_ORDER in lib/orders.ts (the server enforces it either way)
const MAX_PER_ORDER = 10;

const dollars = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export default function BuyTicketsForm({ tiers }: { tiers: TierOption[] }) {
  const [tierId, setTierId] = useState(tiers.find((tier) => tier.remaining > 0)?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const selected = tiers.find((tier) => tier.id === tierId && tier.remaining > 0);
  const maxQuantity = selected ? Math.min(selected.remaining, MAX_PER_ORDER) : 0;
  const total = selected ? selected.priceCents * quantity : 0;

  function chooseTier(id: string) {
    setTierId(id);
    setQuantity(1);
    setError(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    setError(null);
    startTransition(async () => {
      // On success the server action redirects to Stripe and never returns here
      const result = await startCheckout(selected.id, quantity);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div role="radiogroup" aria-label="Ticket type" className="flex flex-col gap-3">
        {tiers.map((tier) => {
          const soldOut = tier.remaining <= 0;
          const isSelected = tier.id === selected?.id;
          return (
            <button
              key={tier.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={soldOut}
              onClick={() => chooseTier(tier.id)}
              className={`flex w-full items-center justify-between gap-4 rounded-2xl border-2 p-5 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
                isSelected
                  ? "border-violet-600 bg-violet-100"
                  : "border-zinc-200 bg-white hover:border-violet-300"
              }`}
            >
              <span>
                <span className="block text-lg font-bold text-neutral-800">{tier.name}</span>
                <span className="mt-1 block text-sm text-zinc-500">
                  {soldOut ? "Sold out" : `${tier.remaining} left`}
                  {tier.description ? ` · ${tier.description}` : ""}
                </span>
              </span>
              <span className="text-lg font-extrabold text-neutral-800">
                {dollars(tier.priceCents)}
              </span>
            </button>
          );
        })}
      </div>

      <div>
        <label htmlFor="quantity" className="text-sm font-semibold text-neutral-800">
          Quantity
        </label>
        <select
          id="quantity"
          value={quantity}
          onChange={(event) => setQuantity(Number(event.target.value))}
          disabled={!selected}
          className="mt-2 h-12 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-violet-600"
        >
          {Array.from({ length: maxQuantity }, (_, index) => index + 1).map((count) => (
            <option key={count} value={count}>
              {count}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={pending || !selected}
        className="h-14 w-full rounded-xl bg-violet-600 text-base font-bold text-white hover:bg-violet-700 disabled:opacity-60"
      >
        {pending
          ? "Opening payment page..."
          : selected
            ? `Continue to payment · ${dollars(total)}`
            : "Sold out"}
      </button>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </form>
  );
}
