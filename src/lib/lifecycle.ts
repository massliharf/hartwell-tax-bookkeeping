/**
 * One lifecycle for every appointment, used by the client's page and Claire's appointment window,
 * so both always agree on where things stand and what comes next.
 *
 *   booked ─▶ documents ─▶ ready ─▶ meeting ─▶ wrap_up ─┬─▶ sign_pay ─▶ to_file ─▶ filed
 *                                                        └─▶ (another meeting) ─▶ ready …
 *   side exits: cancelled, no_show
 */
export type Stage = "documents" | "ready" | "meeting" | "wrap_up" | "sign_pay" | "to_file" | "filed" | "cancelled" | "no_show";

export type LifecycleAppt = {
  status: string; start_at: string; end_at: string; ready_score: number;
  signature_status: string; paid_at: string | null; filed_at: string | null; finished_at?: string | null;
};

export function stageOf(a: LifecycleAppt, nowIso: string): Stage {
  if (a.status === "cancelled") return "cancelled";
  if (a.status === "no_show") return "no_show";
  if (a.filed_at) return "filed";
  if (a.status === "completed") return a.signature_status === "signed" && a.paid_at ? "to_file" : "sign_pay";
  const now = Date.parse(nowIso), start = Date.parse(a.start_at), end = Date.parse(a.end_at);
  if (now >= end) return "wrap_up";
  if (now >= start - 10 * 60e3) return "meeting";
  return a.ready_score >= 100 ? "ready" : "documents";
}

export const STEPS = ["Booked", "Documents", "Appointment", "Sign and pay", "Filed"] as const;
/** Index of the current step for <Stepper>; 5 means everything is done. */
export const stepOf = (s: Stage) => ({ documents: 1, ready: 2, meeting: 2, wrap_up: 2, sign_pay: 3, to_file: 4, filed: 5, cancelled: 0, no_show: 2 })[s];

/** Is the meeting still ahead (so time, place, reschedule and cancel make sense)? */
export const meetingAhead = (s: Stage) => s === "documents" || s === "ready";
