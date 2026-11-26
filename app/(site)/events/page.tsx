import { Suspense } from "react";
import { connection } from "next/server";
import DiscoverPage from "@/components/discover/DiscoverPage";
import { prisma } from "@/lib/prisma";
import { categoryKey, categoryPills, firstParam, toEventCard } from "@/lib/events/discover";

// There's no location feature yet, so the header shows a fixed city.
const CITY_LABEL = "New York, NY";
const MAX_RESULTS = 50;

// US-401 to 405: public list of PUBLISHED events that haven't ended yet.
async function Discover({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const q = firstParam(params.q);
  const category = categoryKey(firstParam(params.category));
  // Render per request: the list depends on the current time and on newly published events
  await connection();
  const now = new Date();

  const upcoming = { status: "PUBLISHED" as const, endsAt: { gt: now } };

  const [events, categories] = await Promise.all([
    prisma.event.findMany({
      where: {
        ...upcoming,
        ...(category ? { category: { equals: category, mode: "insensitive" as const } } : {}),
        ...(q
          ? {
              OR: [
                { title: { contains: q, mode: "insensitive" as const } },
                { description: { contains: q, mode: "insensitive" as const } },
              ],
            }
          : {}),
      },
      orderBy: { startsAt: "asc" },
      take: MAX_RESULTS,
      select: {
        id: true,
        title: true,
        venue: true,
        city: true,
        imageUrl: true,
        startsAt: true,
        tiers: { select: { priceCents: true } },
      },
    }),
    // Pills come from the categories that actually have upcoming events
    prisma.event.findMany({
      where: upcoming,
      distinct: ["category"],
      orderBy: { category: "asc" },
      select: { category: true },
    }),
  ]);

  const [first, ...rest] = events.map((e) => toEventCard(e));
  return (
    <DiscoverPage
      cityLabel={CITY_LABEL}
      rangeLabel="Upcoming"
      activeCategory={category}
      searchValue={q}
      categories={categoryPills(categories.map((c) => c.category))}
      // tag and tagline aren't stored on events, so the featured card shows without them
      featured={first ?? null}
      picks={rest}
    />
  );
}

// Reading searchParams needs a <Suspense> boundary under Cache Components.
export default function EventsPage({ searchParams }: PageProps<"/events">) {
  return (
    <Suspense fallback={<p className="px-4 py-12 text-center text-sm text-[#79747F]">Loading events…</p>}>
      <Discover searchParams={searchParams} />
    </Suspense>
  );
}
