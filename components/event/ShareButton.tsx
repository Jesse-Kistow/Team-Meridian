"use client";

import { useState } from "react";
import { ShareIcon } from "./EventIcons";

/** Uses the phone/desktop share sheet when available, otherwise copies the link. */
export default function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* user cancelled the share sheet, nothing to do */
    }
  }

  return (
    <button type="button" onClick={() => void share()} className="flex items-center gap-2.5 text-[13px] text-[#211E29] hover:text-[#713EFF]">
      <ShareIcon /> {copied ? "Link copied" : "Share"}
    </button>
  );
}
