"use client";

// Connects the checkout screen to the startCheckout server action.
import { useState, useTransition } from "react";
import CheckoutScreen, { type CheckoutTier } from "./CheckoutScreen";
import { startCheckout } from "@/app/(site)/checkout/_actions";

type Props = {
  event: { id: string; title: string; dateLabel: string; locationLabel: string; imageUrl: string | null };
  tiers: CheckoutTier[];
  maxPerOrder: number;
};

export default function EventCheckout({ event, tiers, maxPerOrder }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // On success the action redirects to Stripe, so it only returns on failure
  const onCheckout = (tierId: string, quantity: number) =>
    startTransition(async () => {
      setError(null);
      const result = await startCheckout(tierId, quantity);
      if (result?.error) setError(result.error);
    });

  return (
    <CheckoutScreen
      event={event}
      tiers={tiers}
      maxPerOrder={maxPerOrder}
      // No service fee is charged yet, so don't show one
      serviceFeeRate={0}
      onCheckout={onCheckout}
      pending={pending}
      errorMessage={error}
    />
  );
}
