import Link from "next/link";
import { ChevronDownIcon, QrIcon } from "./OrganizerIcons";
import { formatMoney, percent } from "./format";
import type { DailySales, EventSummary, TierRow } from "./types";

type Props = {
  event: EventSummary;
  grossCents: number;
  /** Change vs the previous 7 days, e.g. 18 for "+18%". Leave out to hide. */
  grossChangePct?: number | null;
  sold: number;
  capacity: number;
  /** One entry per day, oldest first. The last bar is highlighted. */
  daily: DailySales[];
  tiers: TierRow[];
  checkedIn: number;
  createHref?: string;
  checkInHref: string;
  reportHref?: string;
  /** Small line under the cover image, e.g. "Main entrance · Live attendance". */
  entranceLabel?: string;
};

const card = "rounded-[20px] border border-[#E5E1E8] bg-white p-6 sm:p-7";

function StatusBadge({ event }: { event: EventSummary }) {
  if (event.isLive) return <span className="rounded-full bg-[#E5F3EC] px-3 py-[7px] text-[11px] font-bold text-[#23745B]">LIVE</span>;
  const map = {
    PUBLISHED: ["PUBLISHED", "bg-[#EEE7FF] text-[#713EFF]"],
    DRAFT: ["DRAFT", "bg-[#F1EFF3] text-[#79747F]"],
    CANCELLED: ["CANCELLED", "bg-[#FBE9E7] text-[#8C1D18]"],
  } as const;
  const [label, cls] = map[event.status];
  return <span className={`rounded-full px-3 py-[7px] text-[11px] font-bold ${cls}`}>{label}</span>;
}

export default function EventDashboard({
  event,
  grossCents,
  grossChangePct = null,
  sold,
  capacity,
  daily,
  tiers,
  checkedIn,
  createHref = "/organizer/events/new",
  checkInHref,
  reportHref,
  entranceLabel = "Main entrance · Live attendance",
}: Props) {
  const maxDaily = Math.max(1, ...daily.map((d) => d.count));
  const admittedPct = percent(checkedIn, sold);
  const stillToArrive = Math.max(0, sold - checkedIn);

  return (
    <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-7 px-4 py-8 sm:px-8 lg:px-16">
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div className="flex flex-col gap-2.5">
          <p className="text-[11px] font-extrabold tracking-wide text-[#713EFF]">TICKETS / {event.title.toUpperCase()}</p>
          <h1 className="text-3xl font-extrabold text-[#211E29] sm:text-4xl">Ticket &amp; event management</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href={createHref} className="flex h-[50px] items-center rounded-xl bg-[#713EFF] px-5 text-sm font-bold text-white hover:bg-[#5F2FE6]">
            Create an event +
          </Link>
          <Link href={checkInHref} className="flex h-[50px] items-center rounded-xl bg-[#251A3D] px-5 text-sm font-bold text-white hover:bg-[#33264F]">
            Door check-in
          </Link>
        </div>
      </div>

      {/* Active event */}
      <div className="flex items-center gap-4 rounded-2xl border border-[#E5E1E8] bg-white p-[18px]">
        {event.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={event.imageUrl} alt="" className="h-[68px] w-[68px] shrink-0 rounded-[20px] object-cover" />
        ) : (
          <div className="h-[68px] w-[68px] shrink-0 rounded-[20px] bg-[#EEE7FF]" />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-xl font-extrabold text-[#211E29] sm:text-[22px]">{event.title}</p>
          <p className="truncate text-[13px] text-[#79747F]">
            {event.dateLabel} · {event.locationLabel}
          </p>
        </div>
        <span className="hidden rounded-full bg-[#EEE7FF] px-3 py-[7px] text-[11px] font-bold text-[#713EFF] sm:inline">ORGANIZER</span>
        <StatusBadge event={event} />
        <ChevronDownIcon className="text-[#211E29]" />
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex flex-col gap-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className={`${card} flex flex-col gap-3`}>
              <p className="text-[13px] text-[#79747F]">Gross ticket sales</p>
              <p className="text-4xl font-extrabold text-[#211E29]">{formatMoney(grossCents)}</p>
              {grossChangePct != null && (
                <p className="text-xs text-[#713EFF]">
                  {grossChangePct >= 0 ? "↑" : "↓"} {Math.abs(grossChangePct)}% this week
                </p>
              )}
            </div>
            <div className={`${card} flex flex-col gap-3`}>
              <p className="text-[13px] text-[#79747F]">Tickets sold</p>
              <p className="text-4xl font-extrabold text-[#211E29]">
                {sold} / {capacity}
              </p>
              <p className="text-xs text-[#713EFF]">{percent(sold, capacity)}% of capacity</p>
            </div>
          </div>

          <section className={`${card} flex flex-col gap-[22px]`}>
            <div className="flex items-start justify-between">
              <h2 className="text-[22px] font-extrabold text-[#211E29]">Ticket sales</h2>
              <span className="text-xs text-[#79747F]">Last {daily.length} days</span>
            </div>
            {daily.length === 0 ? (
              <p className="text-sm text-[#79747F]">No sales yet.</p>
            ) : (
              <div className="flex h-[205px] items-end gap-3 sm:gap-[30px]">
                {daily.map((d, i) => {
                  const last = i === daily.length - 1;
                  return (
                    <div key={`${d.label}-${i}`} className="flex h-full flex-1 flex-col items-center justify-end gap-3">
                      <div
                        title={`${d.count} tickets`}
                        className={`w-full rounded-t-lg ${last ? "bg-[#713EFF]" : "bg-[#EEE7FF]"}`}
                        style={{ height: `${Math.max(3, (d.count / maxDaily) * 82)}%` }}
                      />
                      <span className={`text-xs ${last ? "text-[#713EFF]" : "text-[#79747F]"}`}>{d.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className={`${card} flex flex-col gap-5`}>
            <div className="flex items-start justify-between">
              <h2 className="text-[22px] font-extrabold text-[#211E29]">Sales by tier</h2>
              {reportHref && (
                <Link href={reportHref} className="text-[13px] font-bold text-[#713EFF] hover:underline">
                  View report ↗
                </Link>
              )}
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)_110px_90px] gap-4 text-[11px] text-[#79747F] sm:grid-cols-[minmax(0,1fr)_150px_120px] sm:gap-6">
              <span>TICKET TIER</span>
              <span>SOLD / CAPACITY</span>
              <span className="text-right">GROSS SALES</span>
            </div>
            {tiers.length === 0 && <p className="text-sm text-[#79747F]">No ticket tiers yet.</p>}
            {tiers.map((t) => (
              <div key={t.id} className="flex flex-col gap-[15px]">
                <hr className="border-[#E5E1E8]" />
                <div className="grid grid-cols-[minmax(0,1fr)_110px_90px] gap-4 text-sm sm:grid-cols-[minmax(0,1fr)_150px_120px] sm:gap-6">
                  <span className="truncate font-bold text-[#211E29]">{t.name}</span>
                  <span className="text-[#79747F]">
                    {t.sold} / {t.capacity}
                  </span>
                  <span className="text-right font-bold text-[#211E29]">{formatMoney(t.grossCents)}</span>
                </div>
              </div>
            ))}
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <section className="flex flex-col gap-[22px] rounded-[20px] bg-[#251A3D] p-6 sm:p-7">
            <div className="flex items-start justify-between">
              <p className="text-sm text-[#D1C8E1]">Checked in tonight</p>
              <QrIcon width={26} height={26} className="text-[#B598FF]" />
            </div>
            <p className="text-4xl font-extrabold text-white sm:text-[44px]">
              {checkedIn} / {sold}
            </p>
            <div className="h-[7px] overflow-hidden rounded-full bg-[#493C60]">
              <div className="h-full rounded-full bg-[#B598FF]" style={{ width: `${admittedPct}%` }} />
            </div>
            <p className="text-[13px] text-[#D1C8E1]">
              {admittedPct}% admitted · {stillToArrive} guests still to arrive
            </p>
            <Link href={checkInHref} className="flex h-[50px] items-center justify-center rounded-xl bg-[#713EFF] text-sm font-bold text-white hover:bg-[#5F2FE6]">
              Door check-in →
            </Link>
          </section>

          <section className={`${card} flex flex-col gap-[22px]`}>
            <h2 className="text-[21px] font-extrabold text-[#211E29]">Tonight at {event.locationLabel}</h2>
            {event.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={event.imageUrl} alt="" className="h-[168px] w-full rounded-[20px] object-cover" />
            ) : (
              <div className="h-[168px] w-full rounded-[20px] bg-[#EEE7FF]" />
            )}
            <p className="text-[13px] text-[#79747F]">
              {event.title} · {event.dateLabel}
            </p>
            <p className="text-[13px] text-[#79747F]">{entranceLabel}</p>
          </section>
        </div>
      </div>
    </div>
  );
}
