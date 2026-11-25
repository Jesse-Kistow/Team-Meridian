import Link from "next/link";
import type { TicketDetailData, TicketQr } from "./types";

// Single ticket with QR codes (US-601, US-603). Simple first version in the
// My Tickets style, until a Figma design exists. Props only, fetches nothing.

const stateCopy: Record<TicketQr["state"], { label: string; cls: string; note: string }> = {
  VALID: { label: "VALID", cls: "bg-[#EAF5EE] text-[#26704B]", note: "Show this code at the door." },
  USED: { label: "CHECKED IN", cls: "bg-[#F3F1F5] text-[#79747F]", note: "This ticket has already been scanned." },
  CANCELLED: { label: "CANCELLED", cls: "bg-[#FBECEF] text-[#A53E50]", note: "This ticket was cancelled." },
  ENDED: { label: "EVENT ENDED", cls: "bg-[#F3F1F5] text-[#79747F]", note: "This event is over." },
};

export default function TicketDetail({ data, backHref = "/my-tickets" }: { data: TicketDetailData; backHref?: string }) {
  const many = data.tickets.length > 1;
  return (
    <div className="mx-auto flex w-full max-w-[880px] flex-col gap-7 px-4 py-10 sm:px-8">
      <Link href={backHref} className="text-[13px] text-[#79747F] hover:text-[#211E29]">
        ← My tickets
      </Link>

      <article className="flex flex-col gap-5 rounded-[20px] border border-[#E5E1E8] bg-white p-6 sm:flex-row sm:items-center sm:gap-[26px]">
        {data.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.imageUrl} alt="" className="h-[140px] w-full shrink-0 rounded-xl object-cover sm:w-52" />
        ) : (
          <div className="h-[140px] w-full shrink-0 rounded-xl bg-gradient-to-br from-[#EEE7FF] to-[#B598FF] sm:w-52" />
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <p className="text-xs font-bold tracking-wide text-[#713EFF]">YOUR TICKET{many ? "S" : ""}</p>
          <h1 className="break-words text-[28px] font-extrabold leading-tight text-[#211E29]">{data.eventTitle}</h1>
          <p className="text-[15px] font-medium text-[#211E29]">
            {data.dateLabel} · {data.timeLabel}
          </p>
          <p className="text-sm text-[#79747F]">
            {data.venue}, {data.city}
          </p>
          <Link href={`/events/${data.eventId}`} className="text-[13px] font-bold text-[#713EFF] hover:underline">
            Event details ↗
          </Link>
        </div>
      </article>

      <div className={`grid gap-5 ${many ? "sm:grid-cols-2" : ""}`}>
        {data.tickets.map((t, i) => {
          const s = stateCopy[t.state];
          return (
            <section key={t.id} className="flex flex-col items-center gap-4 rounded-[20px] border border-[#E5E1E8] bg-white p-6 text-center">
              <div className="flex w-full items-center justify-between">
                <p className="text-sm font-bold text-[#211E29]">{many ? `Ticket ${i + 1} of ${data.tickets.length}` : "Ticket"}</p>
                <span className={`rounded-full px-2.5 py-[5px] text-[11px] font-bold ${s.cls}`}>{s.label}</span>
              </div>
              {t.qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={t.qrDataUrl} alt={`QR code for ticket ${t.ticketCode}`} width={240} height={240} className="h-60 w-60 rounded-xl border border-[#E5E1E8]" />
              ) : (
                <div className="flex h-60 w-60 items-center justify-center rounded-xl bg-[#F3F1F5] text-sm text-[#79747F]">No code to show</div>
              )}
              <div className="flex flex-col gap-0.5">
                <p className="text-base font-extrabold tracking-wide text-[#211E29]">{t.ticketCode}</p>
                <p className="text-[13px] text-[#79747F]">
                  {data.tierName} · {data.holderName}
                </p>
                <p className="text-xs text-[#79747F]">{s.note}</p>
              </div>
            </section>
          );
        })}
      </div>

      <p className="text-center text-xs text-[#79747F]">Keep your QR code private: anyone with it can use your ticket.</p>
    </div>
  );
}
