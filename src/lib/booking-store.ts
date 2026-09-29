import { useCallback, useEffect, useState } from "react";
import type { Answers } from "./intake";

export type BookingDraft = {
  serviceSlug?: string | undefined;
  answers: Answers;
  meetingType: "in_person" | "video";
  date?: string | undefined;
  slot?: string | undefined;
  name: string;
  email: string;
  phone: string;
  phoneHint?: string | null | undefined;
  returning?: boolean | undefined;
};

const KEY = "patel-booking-v1";
export const emptyDraft: BookingDraft = { answers: {}, meetingType: "in_person", name: "", email: "", phone: "" };

export function writeDraft(d: BookingDraft) {
  try { localStorage.setItem(KEY, JSON.stringify(d)); } catch { /* ignore */ }
}
export function clearDraft() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}

/** Booking progress, saved in the browser so a refresh doesn't lose anything. */
export function useBookingDraft() {
  const [draft, setDraft] = useState<BookingDraft>(emptyDraft);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setDraft({ ...emptyDraft, ...JSON.parse(raw) });
    } catch { /* ignore */ }
    setLoaded(true);
  }, []);
  const update = useCallback((patch: Partial<BookingDraft>) => {
    setDraft((d) => {
      const next = { ...d, ...patch };
      writeDraft(next);
      return next;
    });
  }, []);
  return { draft, update, loaded };
}
