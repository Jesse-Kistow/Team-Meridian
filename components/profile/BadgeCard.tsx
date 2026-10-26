import type { ReactNode } from "react";

type BadgeCardProps = {
  icon: ReactNode;
  title: string;
  lines: string[];
  earned: boolean;
};

export default function BadgeCard({ icon, title, lines, earned }: BadgeCardProps) {
  return (
    <div className="flex min-h-52 flex-col gap-3.5 rounded-[20px] border border-zinc-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <span
          className={`flex size-16 items-center justify-center rounded-3xl border-2 ${
            earned
              ? "border-purple-300 bg-violet-100 text-violet-600"
              : "border-zinc-200 bg-stone-200 text-zinc-500"
          }`}
        >
          {icon}
        </span>
        <span className={`text-xs font-bold ${earned ? "text-violet-600" : "text-zinc-500"}`}>
          {earned ? "Earned" : "Locked"}
        </span>
      </div>
      <p className="text-base font-extrabold text-neutral-800">{title}</p>
      <div className="flex flex-col gap-0.5">
        {lines.map((line) => (
          <p key={line} className="text-xs text-zinc-500">
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}