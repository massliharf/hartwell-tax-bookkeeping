import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EmailCard, type PreviewBlock } from "./email-preview";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tag } from "@/components/ui/tag";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { finishAppointment, markFiled, markPaidInOffice, reviewDocument } from "@/lib/owner.functions";
import { fmtDay, money, type Appt, type Item } from "./lib";
import { cn } from "@/lib/utils";

export function useOwnerMutation<T>(fn: (v: T) => Promise<{ ok: boolean }>, success: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (r) => { if (!r.ok) { toast.error("Couldn't save that. Try again."); return; } if (success) toast.success(success); void qc.invalidateQueries({ queryKey: ["owner"] }); },
    onError: () => toast.error("Couldn't save that. Try again."),
  });
}

/** Finish appointment: final fee (prefilled with the service price) and an optional note. */
export function FinishForm({ a, onBack, onDone }: { a: Appt; onBack: () => void; onDone?: (() => void) | undefined }) {
  const finish = useServerFn(finishAppointment);
  const [fee, setFee] = useState(String(a.services?.price_from ?? ""));
  const [note, setNote] = useState("");
  const first = a.clients?.name.split(" ")[0] ?? "the client";
  const m = useOwnerMutation((v: { feeCents: number; note: string }) => finish({ data: { id: a.id, ...v } }), null);
  const cents = Math.round(Number(fee) * 100);
  const valid = fee.trim() !== "" && Number.isFinite(cents) && cents >= 0;
  const feeText = valid && cents > 0 ? ` The fee is $${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: cents % 100 ? 2 : 0 })}.` : "";
  // Same copy as closeout.server.ts, so Claire sees exactly what the client will get.
  const preview: PreviewBlock[] = [
    { p: `Hi ${first}, thanks for coming in. Claire has finished your return.${feeText}` },
    ...(note.trim() ? [{ p: `A note from Claire: ${note.trim()}` }] : []),
    { p: "One short step left: sign your e-file authorization (Form 8879) and pay. Your return is filed as soon as it's signed and paid." },
    { button: { label: "Review, sign and pay" } },
  ];
  const sent = () => {
    toast.success(`Sent to ${first}: review, sign and pay.`, a.manage_token ? { action: { label: `See ${first}'s page`, onClick: () => window.open(`/a/${a.manage_token}`, "_blank", "noopener") } } : undefined);
    onDone?.();
  };
  return (
    <div className="space-y-4">
        <div><h3 className="t-sub">Finish appointment</h3><p className="mt-1 text-sm text-muted-foreground">{a.clients?.name} gets an email to review, sign Form 8879 and pay.</p></div>
        <div className="space-y-4">
          <div>
            <label htmlFor="fee" className="text-sm font-medium text-deep-ink">Final fee</label>
            <div className="relative mt-1.5"><span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
              <Input id="fee" inputMode="decimal" value={fee} onChange={(e) => setFee(e.target.value.replace(/[^0-9.]/g, ""))} className="tabular h-10 pl-7" /></div>
          </div>
          <div>
            <label htmlFor="note" className="text-sm font-medium text-deep-ink">Note to the client <span className="font-normal text-muted-foreground">(optional)</span></label>
            <Textarea id="note" value={note} maxLength={600} onChange={(e) => setNote(e.target.value)} className="mt-1.5" rows={3} />
          </div>
        </div>
        <div>
          <p className="t-label mb-2">What {first} gets</p>
          <p className="mb-2 text-xs text-muted-foreground">Email to {a.clients?.email}{a.clients?.phone ? ", plus a text with the link" : ""}. Subject: Review, sign and pay</p>
          <EmailCard heading="Your return is ready." blocks={preview} />
        </div>
        <div className="flex gap-2"><Button variant="secondary" onClick={onBack}>Back</Button>
          <Button disabled={!valid || m.isPending} onClick={() => m.mutate({ feeCents: cents, note }, { onSuccess: (r) => { if (r.ok) sent(); } })}>{m.isPending ? "Saving…" : "Finish and send"}</Button></div>
    </div>
  );
}

/** After finishing: payment status, Paid in office, and Mark filed (only when signed and paid). */
export function CloseoutBlock({ a }: { a: Appt }) {
  const paidFn = useServerFn(markPaidInOffice), fileFn = useServerFn(markFiled);
  const [confirm, setConfirm] = useState<"paid" | "file" | null>(null);
  const paid = useOwnerMutation(() => paidFn({ data: { id: a.id } }), "Marked as paid.");
  const file = useOwnerMutation(() => fileFn({ data: { id: a.id } }), "Marked filed. The client has been told.");
  if (a.status !== "completed" || a.fee_cents == null) return null;
  const signed = a.signature_status === "signed";
  const reason = !signed && !a.paid_at ? "Waiting for the signature and payment." : !signed ? "Waiting for the Form 8879 signature." : !a.paid_at ? "Waiting for payment." : null;
  return (
    <section className="border-t border-border px-6 py-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="t-sub">Sign, pay and file</h3>
        <p className="tabular text-sm font-medium text-deep-ink">{money(a.fee_cents)}</p>
      </div>
      <ul className="mt-3 divide-y divide-line-1 overflow-hidden rounded-xl border border-line-1 text-sm">
        <li className="flex min-h-11 items-center justify-between gap-3 px-3 py-2"><span className="text-deep-ink">Form 8879</span>{signed ? <Tag tone="success">Signed</Tag> : <Tag>Waiting for the client</Tag>}</li>
        <li className="flex min-h-11 items-center justify-between gap-3 px-3 py-2">
          <span className="text-deep-ink">Payment{a.paid_at && <span className="text-muted-foreground">, {fmtDay(a.paid_at)}{a.paid_method === "in_office" ? " in the office" : a.paid_method === "test" ? " (test)" : " online"}</span>}</span>
          {a.paid_at ? <Tag tone="success">Paid</Tag> : <span className="flex items-center gap-2"><Tag tone="warning">Unpaid</Tag>{!a.filed_at && <Button size="sm" variant="ghost" disabled={paid.isPending} onClick={() => setConfirm("paid")}>{paid.isPending ? "Saving…" : "Paid in office"}</Button>}</span>}
        </li>
        <li className="flex min-h-11 items-center justify-between gap-3 px-3 py-2">
          <span className="text-deep-ink">E-file</span>
          {a.filed_at ? <Tag tone="success">Filed {fmtDay(a.filed_at)}</Tag> : <Button size="sm" disabled={!!reason || file.isPending} onClick={() => setConfirm("file")} title={reason ?? undefined}>{file.isPending ? "Saving…" : "Mark filed"}</Button>}
        </li>
      </ul>
      {!a.filed_at && reason && <p className="mt-2 text-xs text-muted-foreground">Mark filed unlocks when it's signed and paid. {reason}</p>}
      <AlertDialog open={!!confirm} onOpenChange={(v) => { if (!v) setConfirm(null); }}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm === "paid" ? `Mark ${money(a.fee_cents)} as paid?` : `Mark ${a.clients?.name}'s return filed?`}</AlertDialogTitle>
            <AlertDialogDescription>{confirm === "paid" ? "Use this for cash, check or the card terminal. Payment reminders stop." : "The client gets an email that their return has been e-filed."}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => (confirm === "paid" ? paid : file).mutate(undefined)}>{confirm === "paid" ? "Mark paid" : "Mark filed"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

const REASONS = ["Blurry or cut off", "Wrong year", "Wrong form", "Missing pages", "Other"];

export function AiTag({ i }: { i: Item }) {
  if (i.status !== "uploaded") return null;
  if (i.review_status === "needs_fix") return <Tag tone="warning">Fix requested</Tag>;
  if (i.review_status === "accepted") return <Tag tone="success">{i.ai_check === "ok" ? "Auto-checked" : "Accepted"}</Tag>;
  if (i.ai_check === "ok") return <Tag tone="success">Auto-checked</Tag>;
  if (i.ai_check === "warning") return <Tag>Client is replacing it</Tag>;
  if (i.ai_check === "unreadable") return <Tag tone="warning">Couldn't be read</Tag>;
  return <Tag tone="warning">Needs your eyes</Tag>;
}

/** Best guess of why a document needs fixing, from the AI note. */
function suggestedReason(i: Item): string | null {
  const n = (i.ai_note ?? "").toLowerCase();
  if (/20\d\d|year/.test(n)) return "Wrong year";
  if (/not a|looks like|instead|wrong form/.test(n)) return "Wrong form";
  if (/blur|read|cut|dark/.test(n) || i.ai_check === "unreadable") return "Blurry or cut off";
  if (/page/.test(n)) return "Missing pages";
  return null;
}

/** Accept / Needs a fix for one uploaded document. */
export function DocReview({ i, inline = false, onDone }: { i: Item; inline?: boolean; onDone?: () => void }) {
  const review = useServerFn(reviewDocument);
  const [fixing, setFixing] = useState(false);
  const [reason, setReason] = useState<string | null>(() => suggestedReason(i));
  const [note, setNote] = useState(() => (i.ai_check === "warning" || i.ai_check === "kept" ? i.ai_note ?? "" : ""));
  const m = useOwnerMutation((v: { decision: "accepted" | "needs_fix"; reason?: string; note?: string }) => review({ data: { itemId: i.id, ...v } }), "Saved.");
  if (i.status !== "uploaded") return null;
  return (
    <div className={inline ? "min-w-0" : "px-4 pb-3"}>
      {!inline && i.ai_note && <p className={cn("text-xs", i.ai_check === "warning" || i.ai_check === "kept" ? "text-warning" : "text-muted-foreground")}>{i.ai_note}{i.ai_check === "kept" && " The client chose to keep it."}</p>}
      {i.review_status === "needs_fix" && <p className="text-xs text-warning">Asked for a fix: {i.fix_reason}{i.fix_note ? `. ${i.fix_note}` : ""}</p>}
      {i.review_status === "pending" && i.ai_check !== "warning" && !fixing && (
        <div className={inline ? "flex gap-1" : "mt-2 flex gap-2"}>
          <Button size="sm" variant="secondary" disabled={m.isPending} onClick={() => m.mutate({ decision: "accepted" }, { onSuccess: (r) => { if (r.ok) onDone?.(); } })}>It's fine</Button>
          <Button size="sm" variant="ghost" disabled={m.isPending} onClick={() => setFixing(true)}>Ask for a new copy</Button>
        </div>
      )}
      {inline && i.review_status === "accepted" && !fixing && (
        <Button size="sm" variant="ghost" className="mt-1 h-7 px-2 text-xs text-muted-foreground" onClick={() => setFixing(true)}>Ask for a new copy</Button>
      )}
      {fixing && (
        <div className="mt-2 space-y-2 rounded-xl bg-surface-2 p-3">
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Reason">
            {REASONS.map((r) => <Button key={r} type="button" size="sm" variant={reason === r ? "dark" : "secondary"} role="radio" aria-checked={reason === r} onClick={() => setReason(r)}>{r}</Button>)}
          </div>
          <Input aria-label="Note to the client (optional)" placeholder="Note to the client (optional)" value={note} maxLength={400} onChange={(e) => setNote(e.target.value)} className="h-9" />
          <div className="flex gap-2">
            <Button size="sm" disabled={!reason || m.isPending} onClick={() => { if (reason) m.mutate({ decision: "needs_fix", reason, note }, { onSuccess: (r) => { setFixing(false); if (r.ok) onDone?.(); } }); }}>{m.isPending ? "Sending…" : "Email the client"}</Button>
            <Button size="sm" variant="ghost" onClick={() => setFixing(false)}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
}
