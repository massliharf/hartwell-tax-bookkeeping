import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const TZ = "America/New_York";

const parts = (d: Date) => {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23", weekday: "short" })
      .formatToParts(d).map((x) => [x.type, x.value]),
  );
  return p as { year: string; month: string; day: string; hour: string; minute: string; weekday: string };
};
/** Date (YYYY-MM-DD) and minutes-since-midnight in the office time zone. */
export function et(iso: string | Date) {
  const p = parts(new Date(iso));
  return { ymd: `${p.year}-${p.month}-${p.day}`, minutes: Number(p.hour) * 60 + Number(p.minute), weekday: p.weekday };
}
/** Office wall time → ISO instant. */
export function etToIso(ymd: string, minutes: number) {
  const [y, m, d] = ymd.split("-").map(Number) as [number, number, number];
  const guess = Date.UTC(y, m - 1, d, Math.floor(minutes / 60), minutes % 60);
  const p = parts(new Date(guess));
  const shown = Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), Number(p.hour), Number(p.minute));
  return new Date(guess + (guess - shown)).toISOString();
}
export const addDays = (ymd: string, n: number) => {
  const d = new Date(`${ymd}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
export const fmtTime = (iso: string) => new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", minute: "2-digit" }).format(new Date(iso));
export const fmtDay = (iso: string) => new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "short", month: "short", day: "numeric" }).format(new Date(iso));
export const fmtLong = (iso: string) => new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "long", month: "long", day: "numeric" }).format(new Date(iso));
export const fmtStamp = (iso: string) => new Intl.DateTimeFormat("en-US", { timeZone: TZ, month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(iso));
export const ymdLabel = (ymd: string) => fmtDay(`${ymd}T12:00:00Z`);

export type Readiness = "ready" | "partial" | "none";
export const readiness = (score: number): Readiness => (score >= 100 ? "ready" : score > 0 ? "partial" : "none");
export const readinessStyle: Record<Readiness, string> = {
  ready: "border-success/40 bg-success/10 text-success",
  partial: "border-warning/40 bg-warning/10 text-warning",
  none: "border-border bg-muted text-muted-foreground",
};

export type Item = { id: string; document_name: string; required: boolean; status: "missing" | "uploaded" | "not_applicable"; file_path: string | null; uploaded_at: string | null; na_reason: string | null; sort_order: number };
export type Appt = {
  id: string; start_at: string; end_at: string; status: string; meeting_type: "in_person" | "video"; ready_score: number;
  signature_status: string; needs_attention: boolean; attention_reason: string | null; client_id: string; service_id: string;
  clients: { id: string; name: string; email: string; phone: string | null } | null;
  services: { name: string; duration_min: number } | null;
  checklist_items: Item[];
};
export const APPT_SELECT =
  "id, start_at, end_at, status, meeting_type, ready_score, signature_status, needs_attention, attention_reason, client_id, service_id, clients(id, name, email, phone), services(name, duration_min), checklist_items(id, document_name, required, status, file_path, uploaded_at, na_reason, sort_order)";

export const missingOf = (a: Appt) => a.checklist_items.filter((i) => i.required && i.status === "missing").sort((x, y) => x.sort_order - y.sort_order);

export const apptsRange = (fromIso: string, toIso: string) =>
  queryOptions({
    queryKey: ["owner", "appts", fromIso, toIso],
    queryFn: async () => {
      const { data, error } = await supabase.from("appointments").select(APPT_SELECT)
        .gte("start_at", fromIso).lt("start_at", toIso).not("status", "in", "(cancelled,rescheduled)").order("start_at");
      if (error) throw error;
      return (data ?? []) as unknown as Appt[];
    },
  });

export const MSG_LABEL: Record<string, string> = {
  booking_confirmation: "Booking confirmation",
  docs_reminder_7d: "Documents reminder",
  readiness_check_48h: "All set",
  reschedule_offer: "Readiness check",
  final_reminder_24h: "Final reminder",
  waitlist_offer: "Waitlist offer",
  abandoned_nudge: "Unfinished booking",
  signature_reminder: "Signature reminder",
  missing_docs_after: "Missing documents",
  new_season: "New season",
};

export type NeedItem =
  | { kind: "low"; id: string; appt: Appt }
  | { kind: "signature"; id: string; appt: Appt }
  | { kind: "failed"; id: string; msg: { id: string; subject: string | null; recipient: string | null; error: string | null; sent_at: string; type: string } }
  | { kind: "claimed"; id: string; offer: { id: string; slot_start: string; name: string; service: string } };

export const needsYou = (nowIso: string) =>
  queryOptions({
    queryKey: ["owner", "needs", nowIso.slice(0, 15)],
    queryFn: async (): Promise<NeedItem[]> => {
      const now = new Date(nowIso).getTime();
      const in48 = new Date(now + 48 * 3600e3).toISOString();
      const ago3 = new Date(now - 3 * 86400e3).toISOString();
      const [low, sig, failed, claimed] = await Promise.all([
        supabase.from("appointments").select(APPT_SELECT).in("status", ["booked", "confirmed"]).lt("ready_score", 70)
          .gt("start_at", nowIso).lte("start_at", in48).order("start_at"),
        supabase.from("appointments").select(APPT_SELECT).eq("status", "completed").eq("signature_status", "pending").lt("end_at", ago3).order("end_at"),
        supabase.from("messages").select("id, subject, recipient, error, sent_at, type").eq("delivery", "failed").order("sent_at", { ascending: false }),
        supabase.from("waitlist_offers").select("id, slot_start, services(name), waitlist(clients(name))").eq("status", "claimed").order("slot_start"),
      ]);
      const err = low.error ?? sig.error ?? failed.error ?? claimed.error;
      if (err) throw err;
      return [
        ...((low.data ?? []) as unknown as Appt[]).filter((a) => a.attention_reason !== "handled").map((a) => ({ kind: "low" as const, id: a.id, appt: a })),
        ...((sig.data ?? []) as unknown as Appt[]).map((a) => ({ kind: "signature" as const, id: a.id, appt: a })),
        ...(failed.data ?? []).map((m) => ({ kind: "failed" as const, id: m.id, msg: m })),
        ...(claimed.data ?? []).map((o) => ({
          kind: "claimed" as const, id: o.id,
          offer: { id: o.id, slot_start: o.slot_start, service: (o.services as { name: string } | null)?.name ?? "", name: ((o.waitlist as { clients: { name: string } | null } | null)?.clients?.name) ?? "A client" },
        })),
      ];
    },
  });
