"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronRightIcon } from "@/components/icons";
import EditNameForm from "./EditNameForm";

export type SettingsItem = {
  title: string;
  description: string;
  href?: string; // a page to link to
  action?: "editProfile"; // opens the name form
};

export default function SettingsCard({ items, name }: { items: SettingsItem[]; name: string }) {
  const [editing, setEditing] = useState(false);
  const rowClass = "flex w-full items-center gap-3 py-4";

  return (
    <section className="rounded-[20px] border border-zinc-200 bg-white p-7">
      <h2 className="text-xl font-extrabold leading-8 text-neutral-800">Account settings</h2>
      <ul className="mt-1 flex flex-col">
        {items.map((item, index) => {
          const content = (
            <>
              <span className="flex-1 text-left">
                <span className="block text-sm font-bold leading-5 text-neutral-800">{item.title}</span>
                <span className="mt-1 block text-xs leading-4 text-zinc-500">{item.description}</span>
              </span>
              <ChevronRightIcon className="size-4 text-zinc-500" />
            </>
          );

          return (
            <li key={item.title} className={index > 0 ? "border-t border-zinc-200" : ""}>
              {item.href ? (
                <Link href={item.href} className={rowClass}>
                  {content}
                </Link>
              ) : item.action === "editProfile" ? (
                <>
                  <button
                    type="button"
                    onClick={() => setEditing((open) => !open)}
                    aria-expanded={editing}
                    className={rowClass}
                  >
                    {content}
                  </button>
                  {editing && <EditNameForm currentName={name} onDone={() => setEditing(false)} />}
                </>
              ) : (
                <div aria-disabled="true" title="Coming soon" className={`${rowClass} cursor-not-allowed opacity-60`}>
                  {content}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}