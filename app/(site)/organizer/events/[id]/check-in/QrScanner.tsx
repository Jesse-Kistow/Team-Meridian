"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { Html5Qrcode } from "html5-qrcode";

type Props = {
  /** Called once per detected code. Scanning stays paused until `paused` goes back to false. */
  onScan: (text: string) => void;
  paused: boolean;
};

// Camera QR scanner (US-701) using html5-qrcode. The library touches `window` when it
// loads, so it's imported inside the effect, never during server rendering.
export default function QrScanner({ onScan, paused }: Props) {
  const elementId = `qr-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const pausedRef = useRef(paused);
  const onScanRef = useRef(onScan);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    pausedRef.current = paused;
    const s = scannerRef.current;
    if (!s?.isScanning) return;
    try {
      if (paused) s.pause(true);
      else s.resume();
    } catch {
      // pause/resume throw if the scanner is already in that state
    }
  }, [paused]);

  useEffect(() => {
    let cancelled = false;
    let scanner: Html5Qrcode | null = null;

    (async () => {
      const { Html5Qrcode } = await import("html5-qrcode");
      if (cancelled) return;
      scanner = new Html5Qrcode(elementId, false);
      scannerRef.current = scanner;
      try {
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (text) => {
            if (pausedRef.current) return;
            pausedRef.current = true; // one result per scan until "Scan next ticket"
            onScanRef.current(text);
          },
          () => {}, // fires for every frame without a QR code; ignore
        );
        if (cancelled) await scanner.stop();
      } catch {
        if (!cancelled) setError("Couldn't open the camera. Allow camera access, or use the manual search.");
      }
    })();

    return () => {
      cancelled = true;
      if (scanner?.isScanning) scanner.stop().catch(() => {});
      scannerRef.current = null;
    };
  }, [elementId]);

  return (
    <div className="flex w-full max-w-[320px] flex-col items-center gap-3">
      <div id={elementId} className="w-full overflow-hidden rounded-[28px] border-2 border-[#B598FF]" />
      {error && <p className="text-center text-[13px] text-[#F2B8B5]">{error}</p>}
    </div>
  );
}
