import Link from "next/link";
import { SearchIcon } from "../organizer/OrganizerIcons";
import { formatMoney } from "../organizer/format";
import type { CategoryPill, EventCardData, FeaturedEvent } from "./types";

type Props = {
  cityLabel: string; // "New York, NY"
  rangeLabel?: string; // "This week"
  /** Selected category key, or "" for "For you". */
  activeCategory?: string;
  searchValue?: string;
  categories: CategoryPill[];
  featured: FeaturedEvent | null;
  picks: EventCardData[];
  /** Where the search form and category pills point, e.g. "/events". Filters travel in the URL (?q=&category=). */
  basePath?: string;
  /** Where "See all" goes. */
  seeAllHref?: string;
};

const fromPrice = (c: number | null) => (c == null ? "Tickets coming soon" : c === 0 ? "Free" : `From ${formatMoney(c)}`);

function Cover({ url, className }: { url: string | null; className: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return url ? <img src={url} alt="" className={`${className} object-cover`} /> : <div className={`${className} bg-gradient-to-br from-[#EEE7FF] to-[#B598FF]`} />;
}

export default function DiscoverPage({
  cityLabel,
  rangeLabel = "This week",
  activeCategory = "",
  searchValue = "",
  categories,
  featured,
  picks,
  basePath = "/events",
  seeAllHref = "/events",
}: Props) {
  const pillHref = (key: string) => (key ? `${basePath}?category=${encodeURIComponent(key)}` : basePath);
  const pill = (active: boolean) =>
    `flex h-[42px] items-center whitespace-nowrap rounded-full px-[18px] text-[13px] font-bold ${active ? "bg-[#713EFF] text-white" : "border border-[#E5E1E8] bg-white text-[#211E29] hover:bg-[#F7F5F1]"}`;

  return (
    <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-7 px-4 py-8 sm:px-8 lg:px-16">
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div className="flex flex-col gap-2.5">
          <p className="text-[11px] font-extrabold tracking-wide text-[#713EFF]">DISCOVER / {cityLabel.split(",")[0].toUpperCase()}</p>
          <h1 className="text-3xl font-extrabold text-[#211E29] sm:text-4xl">Find your next thing.</h1>
        </div>
        <p className="flex items-center gap-2.5 text-sm font-bold text-[#211E29]">
          {cityLabel} <span className="text-[13px] font-normal text-[#79747F]">· {rangeLabel}</span>
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-x-7 gap-y-4">
        <form action={basePath} method="get" role="search" className="flex h-[54px] w-full items-center gap-3 rounded-xl border border-[#E5E1E8] bg-white px-[18px] focus-within:border-[#713EFF] focus-within:ring-2 focus-within:ring-[#713EFF]/20 lg:max-w-[650px] lg:flex-1">
          <SearchIcon className="shrink-0 text-[#79747F]" />
          <input name="q" defaultValue={searchValue} placeholder="Artists, events, or a little adventure" aria-label="Search events" className="flex-1 bg-transparent text-sm text-[#211E29] outline-none placeholder:text-[#79747F]" />
          {activeCategory && <input type="hidden" name="category" value={activeCategory} />}
          <button type="submit" aria-label="Search" className="text-[#713EFF]">
            <SearchIcon width={18} height={18} />
          </button>
        </form>
        <nav aria-label="Categories" className="flex flex-wrap gap-2.5">
          <Link href={pillHref("")} className={pill(activeCategory === "")}>For you</Link>
          {categories.map((c) => (
            <Link key={c.key} href={pillHref(c.key)} className={pill(activeCategory === c.key)}>
              {c.label}
            </Link>
          ))}
        </nav>
      </div>

      {!featured && picks.length === 0 ? (
        <p className="rounded-2xl border border-[#E5E1E8] bg-white px-6 py-14 text-center text-sm text-[#79747F]">
          No events match that search. Try another category or keyword.
        </p>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          {featured && (
            <Link href={`/events/${featured.id}`} className="group relative flex min-h-[460px] flex-col justify-between overflow-hidden rounded-3xl bg-[#251A3D] p-6 text-white sm:p-[34px] lg:min-h-[590px]">
              {featured.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={featured.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
              )}
              <div className="absolute inset-0 bg-gradient-to-b from-[#160C2B]/0 to-[#160C2B]/95" />
              <div className="relative flex items-start justify-between">
                {featured.tag ? <span className="rounded-full bg-[#EEE7FF] px-3 py-[7px] text-[11px] font-bold text-[#713EFF]">{featured.tag}</span> : <span />}
              </div>
              <div className="relative flex flex-col gap-3.5">
                <p className="text-xs font-bold uppercase">
                  {featured.dateLabel} · {featured.locationLabel}
                </p>
                <p className="text-4xl font-black uppercase leading-none sm:text-6xl">{featured.title}</p>
                {featured.tagline && <p className="text-lg">{featured.tagline}</p>}
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <p className="text-xl font-bold">{fromPrice(featured.fromPriceCents)}</p>
                  <span className="flex h-[50px] items-center rounded-xl bg-[#713EFF] px-7 text-sm font-bold group-hover:bg-[#5F2FE6]">Explore event →</span>
                </div>
              </div>
            </Link>
          )}

          <div className="flex flex-col gap-[18px]">
            <div className="flex items-start justify-between">
              <h2 className="text-[23px] font-extrabold text-[#211E29]">Worth going out for</h2>
              <Link href={seeAllHref} className="text-[13px] font-bold text-[#713EFF] hover:underline">See all ↗</Link>
            </div>
            {picks.map((e) => (
              <Link key={e.id} href={`/events/${e.id}`} className="group overflow-hidden rounded-[20px] border border-[#E5E1E8] bg-white hover:shadow-md">
                <Cover url={e.imageUrl} className="h-48 w-full" />
                <div className="flex flex-col gap-2 p-[22px]">
                  <p className="text-[11px] font-extrabold uppercase text-[#713EFF]">{e.dateLabel}</p>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[21px] font-extrabold text-[#211E29]">{e.title}</p>
                    <span aria-hidden className="text-[#211E29] group-hover:text-[#713EFF]">↗</span>
                  </div>
                  <p className="text-[13px] text-[#79747F]">
                    {e.locationLabel} · {fromPrice(e.fromPriceCents)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
