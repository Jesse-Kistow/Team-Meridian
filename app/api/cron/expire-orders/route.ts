// app/api/cron/expire-orders/route.ts  US-506
// Scheduled clean-up: cancels PENDING orders whose hold (expiresAt) has passed and
// gives their tickets back. Checkout and the event page already do this for the tier
// or event they touch; this catches everything else.
//
// Vercel Cron calls it (see vercel.json) with "Authorization: Bearer <CRON_SECRET>".
// Safe to run twice or at the same time as checkout: releaseOrder only changes
// orders that are still PENDING, so stock is returned exactly once.
import { releaseExpiredOrders } from "@/lib/orders";

// releaseExpiredOrders handles 100 orders per call; stop after this many rounds so one run stays short.
const MAX_ROUNDS = 10;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("CRON_SECRET is not set");
    return new Response("Cron not configured", { status: 500 });
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const now = new Date();
  let released = 0;
  for (let round = 0; round < MAX_ROUNDS; round++) {
    const count = await releaseExpiredOrders({ now });
    released += count;
    if (count < 100) break;
  }

  if (released) console.info(`expire-orders: released ${released} order(s)`);
  return Response.json({ released });
}
