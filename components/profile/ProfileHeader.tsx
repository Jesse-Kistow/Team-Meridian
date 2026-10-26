import { initialsOf } from "@/lib/initials";

type ProfileHeaderProps = {
  eyebrow: string;
  name: string;
  tagline: string;
  accountLabel: string;
};

export default function ProfileHeader({ eyebrow, name, tagline, accountLabel }: ProfileHeaderProps) {
  return (
    <>
      <div>
        <p className="text-xs font-extrabold text-violet-600">{eyebrow}</p>
        <h1 className="mt-2.5 text-4xl font-extrabold leading-10 text-neutral-800">{name}</h1>
      </div>

      <div className="flex items-center gap-5 rounded-[20px] border border-zinc-200 bg-white p-6">
        <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-violet-100 text-base font-bold tracking-tight text-violet-600">
          {initialsOf(name)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-2xl font-extrabold leading-8 text-neutral-800">{name}</p>
          <p className="mt-1.5 text-sm text-zinc-500">{tagline}</p>
        </div>
        <span className="shrink-0 rounded-full bg-violet-100 px-3 py-1.5 text-xs font-bold text-violet-600">
          {accountLabel}
        </span>
      </div>
    </>
  );
}