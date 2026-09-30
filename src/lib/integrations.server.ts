import { createHmac, timingSafeEqual } from "node:crypto";

/** Private, unguessable token for Claire's calendar feed. Derived from a server secret, so nothing is stored and it can't be guessed. */
export function calendarToken() {
  const secret = process.env["SUPABASE_SERVICE_ROLE_KEY"] ?? "";
  return createHmac("sha256", secret).update("hartwell-calendar-feed-v1").digest("hex").slice(0, 40);
}
export function isCalendarToken(candidate: string) {
  const expected = calendarToken();
  return candidate.length === expected.length && timingSafeEqual(Buffer.from(candidate), Buffer.from(expected));
}
