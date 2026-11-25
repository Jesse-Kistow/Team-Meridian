// Pure helpers for door check-in. No Prisma or Next imports, so they're unit tested.

/** Longest text we accept from a scan or the manual search box. Ticket codes are ~25 chars. */
export const MAX_INPUT_LENGTH = 200;

/**
 * If the query looks like a short display code ("EA-K3J9QZ", "ea-k3j9qz" or just "K3J9QZ"),
 * returns the lower-case id suffix to match on. Otherwise null.
 */
export function shortCodeSuffix(query: string): string | null {
  const m = query.trim().match(/^(?:ea-)?([a-z0-9]{6})$/i);
  return m ? m[1].toLowerCase() : null;
}

/** Cleans a scanned QR value. Returns null for anything that can't be a ticket code. */
export function cleanScannedCode(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const code = raw.trim();
  if (!code || code.length > MAX_INPUT_LENGTH) return null;
  return code;
}
