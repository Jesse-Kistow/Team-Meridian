import CheckoutScreen from "@/components/checkout/CheckoutScreen";

// DEMO DATA. Next step (Sprint 5): load the event + tiers, and pass a server action as onCheckout that
// creates a PENDING Order (with expiresAt) + Stripe Checkout session in one transaction, then redirects.
export default function CheckoutPage() {
  return (
    <CheckoutScreen
      event={{ id: "demo", title: "After Hours", dateLabel: "Fri, Oct 23, 2026 · 7:00 PM", locationLabel: "The Glasshouse, Brooklyn", imageUrl: null }}
      tiers={[
        { id: "t1", name: "Early bird", description: "Same dance floor. Better deal.", priceCents: 2500, remaining: 0 },
        { id: "t2", name: "General admission", description: "Entry + all-night good energy", priceCents: 3500, remaining: 40 },
        { id: "t3", name: "VIP", description: "Priority entry + mezzanine access", priceCents: 6500, remaining: 8 },
      ]}
    />
  );
}
