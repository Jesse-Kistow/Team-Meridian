import type { User } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { HeadphonesIcon, MoonIcon, SparklesIcon, TicketIcon } from "@/components/icons";
import BadgeCard from "./BadgeCard";
import ProfileHeader from "./ProfileHeader";
import SettingsCard, { type SettingsItem } from "./SettingsCard";

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

  // The last two badges need event categories and times: Sprint 9
  const badges = [
    { icon: <TicketIcon className="size-7" />, title: "First night out", lines: ["Your first event check-in"], earned: attended >= 1 },
    { icon: <SparklesIcon className="size-7" />, title: "Culture regular", lines: ["Attend 5 events"], earned: attended >= 5 },
    { icon: <HeadphonesIcon className="size-7" />, title: "Sound seeker", lines: ["Check in at 3 music events"], earned: false },
    { icon: <MoonIcon className="size-7" />, title: "Night owl", lines: ["Check in at 3 late-night events"], earned: false },
  ];
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