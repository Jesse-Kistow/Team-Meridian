// scripts/oversell-test.ts
// Proof of US-504 against a real database:
//   1. 20 buyers try to take the last 5 tickets at the same time. Exactly 5 may win.
//   2. An abandoned (expired) order gives its tickets back, and only once.
// Run with:  npx tsx scripts/oversell-test.ts
// It makes its own test rows (ids start with "test_"), so it doesn't need the seed script.
// Like the seed script, it only runs with SEED_ALLOW=true (personal Neon branches only, never main).
import "dotenv/config";
import { prisma } from "../lib/prisma";
import { createPendingOrder, releaseExpiredOrders, releaseOrder } from "../lib/orders";

if (process.env.SEED_ALLOW !== "true") {
  console.error("Refusing to run. Set SEED_ALLOW=true in your .env, and ONLY on your personal Neon branch (never main).");
  process.exit(1);
}

const BUYER = "test_oversell_buyer";
const ORGANIZER = "test_oversell_org";
const EVENT = "test_oversell_event";
const TIER = "test_oversell_tier";

async function setup() {
  for (const [id, role] of [[BUYER, "ATTENDEE"], [ORGANIZER, "ORGANIZER"]] as const) {
    await prisma.user.upsert({
      where: { id },
      update: {},
      create: { id, clerkId: id, name: id, email: `${id}@example.test`, role },
    });
  }
  const startsAt = new Date(Date.now() + 7 * 24 * 3600_000);
  await prisma.event.upsert({
    where: { id: EVENT },
    update: { status: "PUBLISHED" },
    create: {
      id: EVENT,
      organizerId: ORGANIZER,
      title: "[TEST] Oversell Concert",
      description: "Made by scripts/oversell-test.ts",
      category: "Music",
      venue: "Test Hall",
      city: "Testville",
      startsAt,
      endsAt: new Date(startsAt.getTime() + 3 * 3600_000),
      status: "PUBLISHED",
    },
  });
  await prisma.ticketTier.upsert({
    where: { id: TIER },
    update: {},
    create: { id: TIER, eventId: EVENT, name: "Scarce (5 tickets)", priceCents: 2500, quantity: 5 },
  });
}

async function reset() {
  await prisma.order.deleteMany({ where: { eventId: EVENT } });
  await prisma.ticketTier.update({ where: { id: TIER }, data: { quantitySold: 0 } });
}

const sold = async () => (await prisma.ticketTier.findUniqueOrThrow({ where: { id: TIER } })).quantitySold;

function check(label: string, actual: unknown, expected: unknown) {
  const ok = actual === expected;
  console.log(`${ok ? "ok  " : "FAIL"} ${label}: ${actual} (expected ${expected})`);
  if (!ok) process.exitCode = 1;
}

async function main() {
  await setup();

  console.log("1. 20 buyers, 1 ticket each, all at once");
  await reset();
  const results = await Promise.allSettled(
    Array.from({ length: 20 }, () => createPendingOrder(BUYER, TIER, 1)),
  );
  const succeeded = results.filter((r) => r.status === "fulfilled").length;
  check("succeeded", succeeded, 5);
  check("refused", results.length - succeeded, 15);
  check("quantitySold", await sold(), 5);
  check("orders created", await prisma.order.count({ where: { eventId: EVENT } }), 5);
  check(
    "orders with an expiry time",
    await prisma.order.count({ where: { eventId: EVENT, expiresAt: { gt: new Date() } } }),
    5,
  );

  console.log("2. Expired holds give their tickets back");
  // Pretend two of the five buyers walked away an hour ago
  const [a, b] = await prisma.order.findMany({ where: { eventId: EVENT }, take: 2 });
  await prisma.order.updateMany({
    where: { id: { in: [a.id, b.id] } },
    data: { expiresAt: new Date(Date.now() - 3600_000) },
  });
  check("released", await releaseExpiredOrders({ tierId: TIER }), 2);
  check("released again (no double refund)", await releaseExpiredOrders({ tierId: TIER }), 0);
  check("releaseOrder on a cancelled order", await releaseOrder(a.id), false);
  check("quantitySold", await sold(), 3);
  check("cancelled orders", await prisma.order.count({ where: { eventId: EVENT, status: "CANCELLED" } }), 2);

  console.log("3. A new buyer can take the freed tickets, then it's sold out again");
  await createPendingOrder(BUYER, TIER, 2);
  check("quantitySold", await sold(), 5);
  const extra = await createPendingOrder(BUYER, TIER, 1).then(() => "sold", (e: Error) => e.message);
  check("6th ticket", extra, "Not enough tickets left.");

  console.log("4. A buyer who comes back after a hold expired gets those tickets");
  const [c] = await prisma.order.findMany({ where: { eventId: EVENT, status: "PENDING", items: { some: { quantity: 1 } } }, take: 1 });
  await prisma.order.update({ where: { id: c.id }, data: { expiresAt: new Date(Date.now() - 1000) } });
  // createPendingOrder releases expired holds for the tier before reserving
  await createPendingOrder(BUYER, TIER, 1);
  check("old order status", (await prisma.order.findUniqueOrThrow({ where: { id: c.id } })).status, "CANCELLED");
  check("quantitySold", await sold(), 5);

  await reset();
  console.log(process.exitCode ? "FAIL: check the lines above." : "PASS: no overselling, and expired holds are released.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
