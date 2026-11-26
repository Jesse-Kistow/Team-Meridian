import { beforeEach, describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";

const orders = vi.hoisted(() => ({
  markOrderPaid: vi.fn(),
  markOrderRefunded: vi.fn(),
  releaseOrder: vi.fn(),
  holdOrderIndefinitely: vi.fn(),
}));
const refunds = vi.hoisted(() => ({ create: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("./orders", () => orders);
vi.mock("./stripe", () => ({ stripe: { refunds } }));

import { fulfillCheckoutSession, handleStripeEvent } from "./checkout";

const session = (patch: Partial<Stripe.Checkout.Session> = {}) =>
  ({
    id: "cs_test",
    metadata: { orderId: "order_1" },
    client_reference_id: "order_1",
    payment_status: "paid",
    status: "complete",
    payment_intent: "pi_1",
    ...patch,
  }) as Stripe.Checkout.Session;

const event = (type: string, object: Stripe.Checkout.Session) =>
  ({ id: "evt_1", type, data: { object } }) as unknown as Stripe.Event;

beforeEach(() => vi.clearAllMocks());

describe("fulfillCheckoutSession", () => {
  it("marks a paid session's order as paid", async () => {
    orders.markOrderPaid.mockResolvedValue("paid");
    expect(await fulfillCheckoutSession(session())).toBe("paid");
    expect(orders.markOrderPaid).toHaveBeenCalledWith("order_1");
  });

  it("is a no-op the second time", async () => {
    orders.markOrderPaid.mockResolvedValue("already_paid");
    expect(await fulfillCheckoutSession(session())).toBe("already_paid");
    expect(refunds.create).not.toHaveBeenCalled();
  });

  it("falls back to client_reference_id", async () => {
    orders.markOrderPaid.mockResolvedValue("paid");
    await fulfillCheckoutSession(session({ metadata: {} }));
    expect(orders.markOrderPaid).toHaveBeenCalledWith("order_1");
  });

  it("holds the tickets while a bank payment is still clearing", async () => {
    expect(await fulfillCheckoutSession(session({ payment_status: "unpaid" }))).toBe("waiting");
    expect(orders.holdOrderIndefinitely).toHaveBeenCalledWith("order_1");
    expect(orders.markOrderPaid).not.toHaveBeenCalled();
  });

  it("refunds a late payment when the tickets are gone, once", async () => {
    orders.markOrderPaid.mockResolvedValue("needs_refund");
    expect(await fulfillCheckoutSession(session())).toBe("refunded");
    expect(refunds.create).toHaveBeenCalledWith(
      expect.objectContaining({ payment_intent: "pi_1" }),
      { idempotencyKey: "refund-late-order-order_1" },
    );
    expect(orders.markOrderRefunded).toHaveBeenCalledWith("order_1");
  });

  it("ignores sessions without an order id", async () => {
    expect(await fulfillCheckoutSession(session({ metadata: {}, client_reference_id: null }))).toBe("ignored");
  });
});

describe("handleStripeEvent", () => {
  it("fulfils on completed and async success", async () => {
    orders.markOrderPaid.mockResolvedValue("paid");
    expect(await handleStripeEvent(event("checkout.session.completed", session()))).toBe("paid");
    expect(await handleStripeEvent(event("checkout.session.async_payment_succeeded", session()))).toBe("paid");
  });

  it("releases the hold when the session expires or a bank payment fails", async () => {
    orders.releaseOrder.mockResolvedValue(true);
    expect(await handleStripeEvent(event("checkout.session.expired", session()))).toBe("released");
    expect(orders.releaseOrder).toHaveBeenLastCalledWith("order_1", "CANCELLED");
    expect(await handleStripeEvent(event("checkout.session.async_payment_failed", session()))).toBe("released");
    expect(orders.releaseOrder).toHaveBeenLastCalledWith("order_1", "FAILED");
  });

  it("ignores other events", async () => {
    expect(await handleStripeEvent(event("payment_intent.created", session()))).toBe("ignored");
  });
});
