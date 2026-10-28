// scripts/oversell-test.ts
// Throwaway proof of US-504: 20 buyers try to take the last 5 tickets at the same time.
// Run with:  npx tsx scripts/oversell-test.ts
// It resets the seed tier first, so you can run it as often as you like.
import "dotenv/config";
import { prisma } from "../lib/prisma";
import { createPendingOrder } from "../lib/orders";

async function main() {
  const buyer = await prisma.user.findUnique({ where: { clerkId: "seed_buyer" } });
  const tier = await prisma.ticketTier.findFirst({
    where: { name: "Scarce (5 tickets)", event: { title: "[SEED] Test Concert" } },
  });
  if (!buyer || !tier) throw new Error("Seed data not found. Run: npx tsx prisma/seed.ts");

  // Reset: remove earlier test orders for this tier and put the stock back
  await prisma.order.deleteMany({
    where: { userId: buyer.id, items: { some: { tierId: tier.id } } },
  });
  await prisma.ticketTier.update({ where: { id: tier.id }, data: { quantitySold: 0 } });

  // 20 buyers, 1 ticket each, all at once
  const results = await Promise.allSettled(
    Array.from({ length: 20 }, () => createPendingOrder(buyer.id, tier.id, 1)),
  );
  const succeeded = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.length - succeeded;

  const after = await prisma.ticketTier.findUniqueOrThrow({ where: { id: tier.id } });
  const orders = await prisma.order.count({
    where: { userId: buyer.id, items: { some: { tierId: tier.id } } },
  });

  console.log(`Succeeded: ${succeeded} (expected 5)`);
  console.log(`Refused:   ${failed} (expected 15)`);
  console.log(`quantitySold: ${after.quantitySold} (expected 5)`);
  console.log(`Orders created: ${orders} (expected 5)`);

  const pass = succeeded === 5 && failed === 15 && after.quantitySold === 5 && orders === 5;
  console.log(pass ? "PASS: no overselling." : "FAIL: check the numbers above.");
  if (!pass) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());