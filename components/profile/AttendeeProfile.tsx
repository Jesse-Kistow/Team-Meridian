import type { ReactNode } from "react";
import type { User } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { CalendarCheckIcon, SparklesIcon, TicketIcon, UsersIcon } from "@/components/icons";
import { BADGES, type BadgeKey } from "@/lib/badges/rules";
import { dayLabel } from "@/lib/tickets/display";
import BadgeCard from "./BadgeCard";
import ProfileHeader from "./ProfileHeader";
import SettingsCard, { type SettingsItem } from "./SettingsCard";

const BADGE_ICONS: Record<BadgeKey, ReactNode> = {
  "first-event": <TicketIcon className="size-7" />,
  "early-bird": <CalendarCheckIcon className="size-7" />,
  "five-events": <UsersIcon className="size-7" />,
  vip: <SparklesIcon className="size-7" />,
};

const SETTINGS: SettingsItem[] = [
  { title: "Profile details", description: "Name, account role and attendee info", action: "editProfile" },
  { title: "Notifications", description: "Event reminders and badge updates" },
  { title: "Privacy", description: "Manage visibility and sharing" },
  { title: "Help & support", description: "FAQs and attendee assistance" },
];

export default async function AttendeeProfile({ user }: { user: User }) {
  // Real data: how many events this user has been checked in to (0 until Sprint 7)
  const attended = await prisma.checkIn.count({
    where: { ticket: { ownerId: user.id } },
  });

  // US-903: badge definitions with the date this user earned each one (awarded at check-in)
  const awards = await prisma.userBadge.findMany({
    where: { userId: user.id },
    select: { awardedAt: true, badge: { select: { key: true } } },
  });
  const awardedAt = new Map(awards.map((a) => [a.badge.key, a.awardedAt]));
  const badges = BADGES.map((def) => {
    const at = awardedAt.get(def.key);
    return {
      icon: BADGE_ICONS[def.key],
      title: def.name,
      lines: at ? [def.description, `Earned ${dayLabel(at)}`] : [def.description],
      earned: Boolean(at),
    };
  });
  const earnedCount = badges.filter((badge) => badge.earned).length;

  const tagline =
    attended === 0
      ? "No events yet. Your first night out is waiting."
      : `${attended} ${attended === 1 ? "event" : "events"}. Countless good memories.`;

  return (
    <div className="flex flex-col gap-7 px-6 pb-12 pt-9 lg:px-16">
      <ProfileHeader
        eyebrow="ATTENDEE PROFILE"
        name={user.name}
        tagline={tagline}
        accountLabel="Attendee account"
      />

      <div className="grid items-start gap-9 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="flex flex-col gap-5">
          <div className="flex items-start justify-between">
            <h2 className="text-2xl font-extrabold leading-9 text-neutral-800">Your collection</h2>
            <p className="text-xs font-bold leading-5 text-violet-600">
              {earnedCount} of {badges.length} earned
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {badges.map((badge) => (
              <BadgeCard key={badge.title} {...badge} />
            ))}
          </div>
        </section>

        <SettingsCard items={SETTINGS} name={user.name} />
      </div>
    </div>
  );
}