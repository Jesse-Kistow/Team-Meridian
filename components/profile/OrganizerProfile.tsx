import Link from "next/link";
import type { User } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { CalendarCheckIcon, CalendarIcon, UsersIcon } from "@/components/icons";
import BadgeCard from "./BadgeCard";
import ProfileHeader from "./ProfileHeader";
import SettingsCard, { type SettingsItem } from "./SettingsCard";

const SETTINGS: SettingsItem[] = [
  { title: "Organizer details", description: "Name, account role and public profile", action: "editProfile" },
  { title: "Team & permissions", description: "Manage your team and check-in staff" },
  { title: "Payouts & billing", description: "Bank account, payments and invoices" },
  { title: "Event badge rewards", description: "Choose badges your attendees can earn" },
  { title: "Notifications & privacy", description: "Sales alerts, visibility and sharing" },
  { title: "Help & support", description: "Get help with hosting and ticket sales" },
];

export default async function OrganizerProfile({ user }: { user: User }) {
  // Real data: published events and the most recent one (empty until Sprint 2)
  const [hosted, latest] = await Promise.all([
    prisma.event.count({ where: { organizerId: user.id, status: "PUBLISHED" } }),
    prisma.event.findFirst({
      where: { organizerId: user.id, status: "PUBLISHED" },
      orderBy: { startsAt: "desc" },
    }),
  ]);

  const sold = latest
    ? ((
        await prisma.ticketTier.aggregate({
          where: { eventId: latest.id },
          _sum: { quantitySold: true },
        })
      )._sum.quantitySold ?? 0)
    : 0;

  const achievements = [
    { icon: <CalendarCheckIcon className="size-7" />, title: "First event", lines: ["Published your first event"], earned: hosted >= 1 },
    { icon: <UsersIcon className="size-7" />, title: "Community builder", lines: ["Host 5 events"], earned: hosted >= 5 },
  ];

  const tagline = `${hosted} ${hosted === 1 ? "event" : "events"} hosted.`;

  return (
    <div className="flex flex-col gap-7 px-6 pb-12 pt-9 lg:px-16">
      <ProfileHeader
        eyebrow="ORGANIZER PROFILE"
        name={user.name}
        tagline={tagline}
        accountLabel="Organizer account"
      />

      <div className="grid items-start gap-9 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex flex-col gap-7">
          <section className="flex flex-col gap-5 rounded-[20px] bg-indigo-950 p-7 text-white">
            <h2 className="text-2xl font-extrabold leading-10">Your organizer workspace</h2>
            <p className="text-base text-gray-300">Manage events, ticket sales and door check-in.</p>

            {latest ? (
              <div className="flex items-center gap-5">
                <div className="flex h-24 w-32 shrink-0 items-center justify-center rounded-[20px] bg-violet-600/30 text-violet-200">
                  <CalendarIcon className="size-8" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-2xl font-extrabold leading-9">{latest.title}</p>
                  <p className="mt-2 text-xs text-gray-300">
                    {latest.startsAt.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      timeZone: "UTC",
                    })}{" "}
                    · {sold} tickets sold
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-gray-200 px-3 py-1.5 text-xs font-bold text-teal-700">
                  PUBLISHED
                </span>
              </div>
            ) : (
              <p className="rounded-2xl bg-white/10 p-5 text-sm text-gray-300">
                You haven&apos;t published an event yet. Your first one will show up here.
              </p>
            )}

            <Link
              href="/organizer/events"
              className="flex h-12 items-center justify-center rounded-xl bg-violet-600 text-sm font-bold text-white hover:bg-violet-700"
            >
              Open ticket &amp; event management →
            </Link>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-2xl font-extrabold leading-8 text-neutral-800">Your achievements</h2>
            <p className="text-xs leading-5 text-zinc-500">Milestones earned by hosting events.</p>
            <div className="grid gap-5 sm:grid-cols-2">
              {achievements.map((badge) => (
                <BadgeCard key={badge.title} {...badge} />
              ))}
            </div>
          </section>
        </div>

        <SettingsCard items={SETTINGS} name={user.name} />
      </div>
    </div>
  );
}