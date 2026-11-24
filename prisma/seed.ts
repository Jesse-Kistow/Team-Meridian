/**
 * Seed script: fills YOUR personal Neon branch with fake events, tiers, orders,
 * tickets, badges and notifications so you can build screens without waiting
 * for other people's features.
 *
 * Safe to run many times (it upserts, never duplicates). All fake rows have ids
 * starting with "seed_" so they are easy to spot.
 *
 * NEVER run this against `main` (the shared staging database).
 *
 * Needed in your .env:
 *   DATABASE_URL=<your personal branch, direct string>
 *   SEED_ALLOW=true
 *   SEED_ATTENDEE_EMAIL=<email of a real test account you signed up as Attendee>
 *   SEED_ORGANIZER_EMAIL=<email of a real test account you signed up as Organizer>
 *
 * Run:  npx prisma db seed
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

if (process.env.SEED_ALLOW !== "true") {
  console.error(
    "Refusing to seed. Set SEED_ALLOW=true in your .env, and ONLY on your personal Neon branch (never main).",
  );
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const DAY = 24 * 60 * 60 * 1000;
const now = Date.now();
const daysFromNow = (d: number, hour = 18) => {
  const date = new Date(now + d * DAY);
  date.setUTCHours(hour, 0, 0, 0);
  return date;
};
const plusHours = (date: Date, h: number) => new Date(date.getTime() + h * 60 * 60 * 1000);

type TierSeed = { key: string; name: string; description?: string; priceCents: number; quantity: number };
type EventSeed = {
  key: string;
  title: string;
  description: string;
  category: string;
  venue: string;
  city: string;
  imageUrl: string | null;
  startsAt: Date;
  status: "DRAFT" | "PUBLISHED" | "CANCELLED";
  organizer: "seedA" | "seedB" | "real";
  tiers: TierSeed[];
};

const EVENTS: EventSeed[] = [
  {
    key: "jazz",
    title: "Rooftop Jazz Night",
    description: "An evening of live jazz with skyline views. Doors open at 6pm.",
    category: "Music",
    venue: "Skyline Terrace",
    city: "Atlanta",
    imageUrl: null,
    startsAt: daysFromNow(7),
    status: "PUBLISHED",
    organizer: "seedA",
    tiers: [
      { key: "ga", name: "General Admission", priceCents: 2500, quantity: 100 },
      { key: "vip", name: "VIP", description: "Front tables and a drink", priceCents: 6000, quantity: 20 },
    ],
  },
  {
    key: "tech",
    title: "Campus Tech Meetup",
    description: "Lightning talks and networking for student developers.",
    category: "Technology",
    venue: "Engineering Hall 101",
    city: "Atlanta",
    imageUrl: null,
    startsAt: daysFromNow(3),
    status: "PUBLISHED",
    organizer: "seedA",
    tiers: [{ key: "free", name: "Free Entry", priceCents: 0, quantity: 60 }],
  },
  {
    key: "food",
    title: "Street Food Festival",
    description: "Thirty vendors, live music and a dessert alley.",
    category: "Food & Drink",
    venue: "Piedmont Park",
    city: "Atlanta",
    imageUrl: null,
    startsAt: daysFromNow(14, 12),
    status: "PUBLISHED",
    organizer: "seedB",
    tiers: [
      { key: "early", name: "Early Bird", priceCents: 1500, quantity: 50 },
      { key: "std", name: "Standard", priceCents: 2000, quantity: 200 },
      { key: "tasting", name: "Tasting Pass", description: "10 tasting tokens", priceCents: 4500, quantity: 40 },
    ],
  },
  {
    key: "market",
    title: "Weekend Art Market",
    description: "Local artists, prints and handmade goods.",
    category: "Arts",
    venue: "Old Mill Courtyard",
    city: "Savannah",
    imageUrl: null,
    startsAt: daysFromNow(21, 10),
    status: "PUBLISHED",
    organizer: "seedB",
    tiers: [{ key: "entry", name: "Entry", priceCents: 500, quantity: 300 }],
  },
  {
    key: "run",
    title: "5K Charity Fun Run",
    description: "Run or walk for a good cause. T-shirt included.",
    category: "Sports",
    venue: "Riverside Trail",
    city: "Athens",
    imageUrl: null,
    startsAt: daysFromNow(30, 8),
    status: "PUBLISHED",
    organizer: "real",
    tiers: [
      { key: "run", name: "Runner", priceCents: 3000, quantity: 150 },
      { key: "walk", name: "Walker", priceCents: 2000, quantity: 150 },
    ],
  },
  {
    key: "draft",
    title: "Startup Pitch Night (draft)",
    description: "Not published yet. Used to test that drafts are hidden from the public.",
    category: "Business",
    venue: "Innovation Lab",
    city: "Atlanta",
    imageUrl: null,
    startsAt: daysFromNow(40),
    status: "DRAFT",
    organizer: "real",
    tiers: [],
  },
  {
    key: "cancelled",
    title: "Outdoor Film Screening (cancelled)",
    description: "Cancelled because of weather. Used to test cancelled states.",
    category: "Film",
    venue: "Central Lawn",
    city: "Atlanta",
    imageUrl: null,
    startsAt: daysFromNow(10),
    status: "CANCELLED",
    organizer: "seedA",
    tiers: [{ key: "ga", name: "General Admission", priceCents: 1200, quantity: 80 }],
  },
  {
    key: "past",
    title: "Spring Open Mic (past)",
    description: "Already happened. Used to test past-event behaviour and check-ins.",
    category: "Music",
    venue: "The Corner Cafe",
    city: "Atlanta",
    imageUrl: null,
    startsAt: daysFromNow(-20),
    status: "PUBLISHED",
    organizer: "real",
    tiers: [{ key: "ga", name: "Entry", priceCents: 800, quantity: 40 }],
  },
];

const BADGES = [
  { key: "first-event", name: "First Event", description: "Attended your first event." },
  { key: "early-bird", name: "Early Bird", description: "Bought a ticket more than 14 days ahead." },
  { key: "five-events", name: "5 Events Attended", description: "Checked in to five events." },
  { key: "vip", name: "VIP", description: "Bought a VIP ticket." },
];

async function findUserByEmail(email: string | undefined, label: string) {
  if (!email) return null;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.warn(
      `! No user with email ${email} (${label}). Sign in to the app once with that account on this branch, then run the seed again.`,
    );
  }
  return user;
}

async function main() {
  // 1. Fake organizers (not real Clerk accounts, they only own events)
  const seedA = await prisma.user.upsert({
    where: { id: "seed_org_a" },
    update: {},
    create: {
      id: "seed_org_a",
      clerkId: "seed_clerk_org_a",
      name: "Northside Events",
      email: "seed-org-a@example.test",
      role: "ORGANIZER",
      organizationName: "Northside Events Co.",
    },
  });
  const seedB = await prisma.user.upsert({
    where: { id: "seed_org_b" },
    update: {},
    create: {
      id: "seed_org_b",
      clerkId: "seed_clerk_org_b",
      name: "Peach City Collective",
      email: "seed-org-b@example.test",
      role: "ORGANIZER",
      organizationName: "Peach City Collective",
    },
  });

  // 2. Real test accounts you signed in with (found by email)
  const realOrganizer = await findUserByEmail(process.env.SEED_ORGANIZER_EMAIL, "organizer");
  const realAttendee = await findUserByEmail(process.env.SEED_ATTENDEE_EMAIL, "attendee");

  if (realOrganizer && !realOrganizer.organizationName) {
    await prisma.user.update({
      where: { id: realOrganizer.id },
      data: { organizationName: "Team Meridian Events" },
    });
  }

  const organizerFor = (who: EventSeed["organizer"]) =>
    who === "seedA" ? seedA : who === "seedB" ? seedB : (realOrganizer ?? seedA);

  // 3. Badges
  const badgeIds: Record<string, string> = {};
  for (const b of BADGES) {
    const badge = await prisma.badge.upsert({
      where: { key: b.key },
      update: { name: b.name, description: b.description },
      create: b,
    });
    badgeIds[b.key] = badge.id;
  }

  // 4. Events and tiers
  const tierIds: Record<string, string> = {}; // "eventKey:tierKey" -> id
  const eventIds: Record<string, string> = {};
  for (const e of EVENTS) {
    const id = `seed_evt_${e.key}`;
    const organizer = organizerFor(e.organizer);
    const data = {
      organizerId: organizer.id,
      title: e.title,
      description: e.description,
      category: e.category,
      venue: e.venue,
      city: e.city,
      imageUrl: e.imageUrl,
      startsAt: e.startsAt,
      endsAt: plusHours(e.startsAt, 3),
      status: e.status,
    };
    await prisma.event.upsert({ where: { id }, update: data, create: { id, ...data } });
    eventIds[e.key] = id;

    for (const t of e.tiers) {
      const tid = `seed_tier_${e.key}_${t.key}`;
      const tdata = {
        eventId: id,
        name: t.name,
        description: t.description ?? null,
        priceCents: t.priceCents,
        quantity: t.quantity,
      };
      await prisma.ticketTier.upsert({ where: { id: tid }, update: tdata, create: { id: tid, ...tdata } });
      tierIds[`${e.key}:${t.key}`] = tid;
    }
  }

  // 5. Orders, tickets, check-ins for the real attendee (skipped if not found)
  if (realAttendee) {
    type OrderSeed = {
      key: string;
      event: string;
      tier: string;
      qty: number;
      status: "PAID" | "PENDING" | "FAILED";
      checkIn?: boolean;
      expiresInMinutes?: number;
    };
    const orders: OrderSeed[] = [
      { key: "1", event: "jazz", tier: "vip", qty: 1, status: "PAID" },
      { key: "2", event: "food", tier: "early", qty: 2, status: "PAID" },
      { key: "3", event: "past", tier: "ga", qty: 1, status: "PAID", checkIn: true },
      { key: "4", event: "market", tier: "entry", qty: 1, status: "PENDING", expiresInMinutes: 30 },
      { key: "5", event: "tech", tier: "free", qty: 1, status: "PENDING", expiresInMinutes: -45 }, // already expired
      { key: "6", event: "run", tier: "walk", qty: 1, status: "FAILED" },
    ];

    for (const o of orders) {
      const orderId = `seed_order_${o.key}`;
      const tierId = tierIds[`${o.event}:${o.tier}`];
      const unit = EVENTS.find((e) => e.key === o.event)!.tiers.find((t) => t.key === o.tier)!.priceCents;
      const expiresAt =
        o.status === "PENDING" && o.expiresInMinutes !== undefined
          ? new Date(now + o.expiresInMinutes * 60 * 1000)
          : null;

      const odata = {
        userId: realAttendee.id,
        eventId: eventIds[o.event],
        status: o.status,
        totalCents: unit * o.qty,
        expiresAt,
      };
      await prisma.order.upsert({ where: { id: orderId }, update: odata, create: { id: orderId, ...odata } });

      const itemId = `seed_item_${o.key}`;
      const idata = { orderId, tierId, quantity: o.qty, unitPriceCents: unit };
      await prisma.orderItem.upsert({ where: { id: itemId }, update: idata, create: { id: itemId, ...idata } });

      // Tickets exist only for PAID orders
      if (o.status === "PAID") {
        for (let i = 1; i <= o.qty; i++) {
          const ticketId = `seed_ticket_${o.key}_${i}`;
          const used = o.checkIn === true;
          const tdata = {
            code: `seed-code-${o.key}-${i}`,
            status: used ? ("USED" as const) : ("VALID" as const),
            orderId,
            tierId,
            eventId: eventIds[o.event],
            ownerId: realAttendee.id,
          };
          await prisma.ticket.upsert({ where: { id: ticketId }, update: tdata, create: { id: ticketId, ...tdata } });

          if (used) {
            const scanner = realOrganizer ?? seedA;
            await prisma.checkIn.upsert({
              where: { ticketId },
              update: {},
              create: {
                id: `seed_checkin_${o.key}_${i}`,
                ticketId,
                eventId: eventIds[o.event],
                scannedById: scanner.id,
                checkedInAt: daysFromNow(-20, 18),
              },
            });
          }
        }
      }
    }

    // quantitySold = number of tickets from PAID orders + held PENDING quantities (not expired)
    for (const e of EVENTS) {
      for (const t of e.tiers) {
        const tid = tierIds[`${e.key}:${t.key}`];
        const mine = orders
          .filter((o) => o.event === e.key && o.tier === t.key && (o.status === "PAID" || (o.status === "PENDING" && (o.expiresInMinutes ?? 0) > 0)))
          .reduce((sum, o) => sum + o.qty, 0);
        // pretend other buyers bought some too, so the numbers look real
        const others = Math.floor(t.quantity * 0.2);
        await prisma.ticketTier.update({ where: { id: tid }, data: { quantitySold: mine + others } });
      }
    }

    // Badges and notifications for the attendee
    await prisma.userBadge.upsert({
      where: { userId_badgeId: { userId: realAttendee.id, badgeId: badgeIds["first-event"] } },
      update: {},
      create: { id: "seed_userbadge_1", userId: realAttendee.id, badgeId: badgeIds["first-event"] },
    });
    await prisma.userBadge.upsert({
      where: { userId_badgeId: { userId: realAttendee.id, badgeId: badgeIds["vip"] } },
      update: {},
      create: { id: "seed_userbadge_2", userId: realAttendee.id, badgeId: badgeIds["vip"] },
    });

    const notifs = [
      { id: "seed_notif_1", type: "BADGE_EARNED" as const, title: "You earned the First Event badge", href: "/profile", readAt: null },
      { id: "seed_notif_2", type: "ORDER_CONFIRMED" as const, title: "Order confirmed: Rooftop Jazz Night", href: "/my-tickets", readAt: null },
      { id: "seed_notif_3", type: "EVENT_REMINDER" as const, title: "Campus Tech Meetup starts in 3 days", href: "/my-tickets", readAt: new Date(now - DAY) },
    ];
    for (const n of notifs) {
      const data = { userId: realAttendee.id, type: n.type, title: n.title, href: n.href, readAt: n.readAt };
      await prisma.notification.upsert({ where: { id: n.id }, update: data, create: { ...data, id: n.id } });
    }
  }

  const counts = {
    users: await prisma.user.count(),
    events: await prisma.event.count(),
    tiers: await prisma.ticketTier.count(),
    orders: await prisma.order.count(),
    tickets: await prisma.ticket.count(),
    badges: await prisma.badge.count(),
    notifications: await prisma.notification.count(),
  };
  console.log("Seed complete:", counts);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
