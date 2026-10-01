import { Tag } from "@/components/ui/tag";
import { stageOf } from "@/lib/lifecycle";
import { fmtDay, missingOf, money, type Appt } from "./lib";

type Turn = "you" | "client" | "auto" | "done";
const TURN: Record<Turn, { label: string; tone: "warning" | "neutral" | "accent" | "success" }> = {
  you: { label: "Your turn", tone: "warning" },
  client: { label: "Waiting on client", tone: "neutral" },
  auto: { label: "Running on its own", tone: "accent" },
  done: { label: "Done", tone: "success" },
};

/** One sentence that says where this appointment stands and whose move it is. Same rules everywhere Claire looks. */
export function nowOf(a: Appt, nowIso: string): { turn: Turn; text: string } {
  const st = stageOf(a, nowIso);
  const first = a.clients?.name.split(" ")[0] ?? "the client";
  const missing = missingOf(a).length;
  const eyes = a.checklist_items.filter((i) => i.status === "uploaded" && i.review_status === "pending" && i.ai_check !== "warning" && i.ai_check !== "ok").length;
  if (st === "cancelled") return { turn: "done", text: "Cancelled. The time was offered to the waitlist." };
  if (st === "no_show") return { turn: "done", text: `${first} didn't come. You can send a rebooking link from the … menu.` };
  if (st === "filed") return { turn: "done", text: `Filed ${fmtDay(a.filed_at!)}. ${first} was emailed.` };
  if (st === "to_file") return { turn: "you", text: `Signed and paid. File the return, then mark it filed.` };
  if (st === "sign_pay") return a.signature_status !== "signed"
    ? { turn: "client", text: `Waiting for ${first} to sign Form 8879. Reminders go out on their own.` }
    : { turn: "client", text: `Signed. Waiting for payment of ${a.fee_cents != null ? money(a.fee_cents) : "the fee"}. Reminders go out on days 1, 3 and 5.` };
  if (st === "wrap_up") return { turn: "you", text: "The meeting has ended. Finish the return, or book another meeting." };
  if (st === "meeting") return { turn: "you", text: `${first}'s appointment is now.` };
  if (eyes) return { turn: "you", text: `${eyes} document${eyes === 1 ? " needs" : "s need"} your eyes. Everything else was checked automatically.` };
  if (a.checklist_items.length === 0 || a.intake_answers?.["intake_pending"]) return { turn: "client", text: `Waiting for ${first} to answer the five questions. The checklist builds from them.` };
  if (missing) return { turn: "client", text: `Waiting for ${first} to send ${missing} document${missing === 1 ? "" : "s"}. Reminders go out on their own.` };
  return { turn: "auto", text: "Everything is in. The appointment reminder goes out the day before." };
}

export function NowBanner({ a, nowIso, className = "", action }: { a: Appt; nowIso: string; className?: string; action?: React.ReactNode }) {
  const n = nowOf(a, nowIso);
  return (
    <div role="status" className={`flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-xl border px-4 py-3 ${n.turn === "you" ? "border-alert-warning-fg/25 bg-alert-warning" : "border-line-1 bg-surface-2"} ${className}`}>
      <Tag tone={TURN[n.turn].tone}>{TURN[n.turn].label}</Tag>
      <p className="min-w-0 flex-1 text-sm text-deep-ink">{n.text}</p>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
