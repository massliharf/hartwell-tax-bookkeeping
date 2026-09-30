import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Check, Clock, FilePlus2, Minus, MoreHorizontal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { nudgeSignature, ownerCancelAppointment, remindPayment, requestExtraDocument, resendPortalLink, sendApptReminder, sendDocsReminder, sendRebookLink } from "@/lib/owner.functions";
import { fmtDay, missingOf, type Appt } from "./lib";
import { cn } from "@/lib/utils";

type Msg = { id: string; type: string; sent_at: string };
type Step = { key: string; label: string; state: "sent" | "scheduled" | "due" | "skipped"; at?: string | undefined; note?: string | undefined; action?: { label: string; run: () => Promise<{ ok: boolean; message?: string }> } | undefined };

const H = 3600e3, D = 24 * H;

function useSend() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (fn: () => Promise<{ ok: boolean; message?: string }>) => fn(),
    onSuccess: (r) => { (r.ok ? toast.success : toast.error)(r.message ?? (r.ok ? "Sent." : "Nothing was sent.")); void qc.invalidateQueries({ queryKey: ["owner"] }); },
    onError: () => toast.error("That didn't go through. Try again."),
  });
}

/** Every state of an appointment, what goes out automatically, when, and a manual "Send now" for each. */
export function FollowUps({ a, now }: { a: Appt; now: string }) {
  const fns = {
    docs: useServerFn(sendDocsReminder), remind: useServerFn(sendApptReminder), link: useServerFn(resendPortalLink),
    sign: useServerFn(nudgeSignature), pay: useServerFn(remindPayment), rebook: useServerFn(sendRebookLink),
  };
  const send = useSend();
  const msgs = useQuery({
    queryKey: ["owner", "appt-messages", a.id],
    queryFn: async () => { const { data, error } = await supabase.from("messages").select("id, type, sent_at").eq("appointment_id", a.id).eq("channel", "email").order("sent_at"); if (error) throw error; return (data ?? []) as Msg[]; },
  });
  const timings = useQuery({
    queryKey: ["owner", "timings"],
    queryFn: async () => { const { data } = await supabase.from("settings").select("reminder_timings").eq("id", 1).maybeSingle(); return (data?.reminder_timings ?? {}) as { docs_reminder_days?: number; readiness_check_hours?: number; final_reminder_hours?: number }; },
  });
  const sent = (...types: string[]) => (msgs.data ?? []).filter((m) => types.includes(m.type));
  const last = (...types: string[]) => sent(...types).at(-1)?.sent_at;
  const t = Date.parse(now);
  const start = Date.parse(a.start_at);
  const open = a.status === "booked" || a.status === "confirmed";
  const missing = missingOf(a).length;
  const tm = timings.data ?? {};
  const docsD = Number(tm.docs_reminder_days) || 7, readyH = Number(tm.readiness_check_hours) || 48, finalH = Number(tm.final_reminder_hours) || 24;
  const at = (ms: number) => new Date(ms).toISOString();
  const future = (ms: number) => ms > t;

  const steps: Step[] = [];
  steps.push({ key: "confirm", label: "Booking confirmation", state: last("booking_confirmation") ? "sent" : "due", at: last("booking_confirmation"),
    action: { label: "Resend link", run: () => fns.link({ data: { id: a.id } }) } });
  if (a.status !== "completed" && a.status !== "no_show" && a.status !== "cancelled") {
    const docsAt = start - docsD * D;
    steps.push({ key: "docs", label: "Document reminder", note: !missing ? "Everything is in" : last("docs_reminder_7d") || future(docsAt) ? `${missing} missing` : `Booked after its date, ${missing} missing`,
      state: last("docs_reminder_7d") ? "sent" : !missing ? "skipped" : future(docsAt) ? "scheduled" : "skipped", at: last("docs_reminder_7d") ?? at(docsAt),
      action: open && missing ? { label: "Send now", run: () => fns.docs({ data: { id: a.id } }) } : undefined });
    const readyAt = start - readyH * H;
    steps.push({ key: "ready", label: "Readiness check", note: last("readiness_check_48h", "reschedule_offer") || future(readyAt) ? "Offers a later time if documents are still missing" : "Booked after its date",
      state: last("readiness_check_48h", "reschedule_offer") ? "sent" : future(readyAt) ? "scheduled" : "skipped", at: last("readiness_check_48h", "reschedule_offer") ?? at(readyAt) });
    const finalAt = start - finalH * H;
    steps.push({ key: "final", label: "Appointment reminder", note: last("final_reminder_24h") || future(finalAt) ? undefined : "Booked after its date", state: last("final_reminder_24h") ? "sent" : future(finalAt) ? "scheduled" : "skipped", at: last("final_reminder_24h") ?? at(finalAt),
      action: open ? { label: "Send now", run: () => fns.remind({ data: { id: a.id } }) } : undefined });
  }
  if (a.status === "completed") {
    const fin = a.finished_at ? Date.parse(a.finished_at) : Date.parse(a.end_at);
    steps.push({ key: "rsp", label: "Review, sign and pay", state: last("review_sign_pay") ? "sent" : "skipped", at: last("review_sign_pay") });
    const signed = a.signature_status === "signed";
    steps.push({ key: "sign", label: "Signature reminder", note: signed ? "Signed" : `${sent("signature_reminder").length} sent`,
      state: signed ? "skipped" : last("signature_reminder") ? "sent" : "scheduled", at: last("signature_reminder") ?? at(fin + D),
      action: !signed ? { label: "Send now", run: () => fns.sign({ data: { id: a.id } }) } : undefined });
    const paid = !!a.paid_at;
    const payCount = sent("payment_reminder").length;
    const nextPay = [1, 3, 5].map((d) => fin + d * D).find((ms) => ms > t);
    steps.push({ key: "pay", label: "Payment reminders", note: paid ? `Paid ${fmtDay(a.paid_at!)}` : a.fee_cents == null ? "No fee set" : `${payCount} of 3 sent`,
      state: paid || a.fee_cents == null ? "skipped" : nextPay ? "scheduled" : payCount ? "sent" : "due", at: paid ? a.paid_at! : nextPay ? at(nextPay) : last("payment_reminder"),
      action: !paid && a.fee_cents != null ? { label: "Send now", run: () => fns.pay({ data: { id: a.id } }) } : undefined });
    steps.push({ key: "filed", label: "Return filed", state: last("return_filed") ? "sent" : a.filed_at ? "sent" : "scheduled", note: a.filed_at ? undefined : "Sent when you mark it filed", at: last("return_filed") ?? a.filed_at ?? undefined });
  }
  if (a.status === "no_show") {
    steps.push({ key: "rebook", label: "Rebooking link", state: last("reschedule_offer") ? "sent" : "due", at: last("reschedule_offer"),
      action: { label: "Send now", run: () => fns.rebook({ data: { id: a.id } }) } });
  }

  return (
    <section className="border-t border-border px-6 py-5">
      <h3 className="text-[13px] font-medium text-deep-ink">Follow-ups</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">These go out on their own. Send any of them now if you'd rather not wait.</p>
      <ol className="mt-3 space-y-1">
        {steps.map((s) => (
          <li key={s.key} className="flex min-h-10 items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-surface-2">
            <span className={cn("grid size-6 shrink-0 place-items-center rounded-full",
              s.state === "sent" ? "bg-alert-success text-alert-success-fg" : s.state === "due" ? "bg-alert-warning text-alert-warning-fg" : s.state === "scheduled" ? "bg-alert-info text-alert-info-fg" : "bg-tint-1 text-muted-foreground")}>
              {s.state === "sent" ? <Check className="size-3.5" strokeWidth={2.5} /> : s.state === "skipped" ? <Minus className="size-3.5" /> : <Clock className="size-3.5" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] text-deep-ink">{s.label}</span>
              <span className="block text-[11px] text-muted-foreground">
                {s.state === "skipped"
                  ? (s.note ?? "Not needed")
                  : <>{s.state === "sent" ? `Sent ${s.at ? fmtDay(s.at) : ""}` : s.state === "scheduled" ? `Goes out ${s.at ? fmtDay(s.at) : "automatically"}` : "Not sent yet"}{s.note ? `. ${s.note}` : ""}</>}
              </span>
            </span>
            {s.action && <Button size="sm" variant="ghost" disabled={send.isPending} onClick={() => send.mutate(s.action!.run)}>{s.action.label}</Button>}
          </li>
        ))}
      </ol>
    </section>
  );
}

/** "Ask for another document" after reviewing, inline in the documents section. */
export function RequestDocument({ a }: { a: Appt }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const fn = useServerFn(requestExtraDocument);
  const send = useSend();
  if (a.status === "cancelled" || a.status === "no_show" || a.filed_at) return null;
  if (!open) return <Button size="sm" variant="ghost" className="mt-3" onClick={() => setOpen(true)}><FilePlus2 />Ask for another document</Button>;
  return (
    <div className="mt-3 space-y-2 rounded-xl bg-surface-2 p-3">
      <Input autoFocus aria-label="Document name" placeholder="Document name, e.g. 1099-DIV from Vanguard" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} className="h-9" />
      <Input aria-label="Note to the client (optional)" placeholder="Note to the client (optional)" value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} className="h-9" />
      <div className="flex gap-2">
        <Button size="sm" disabled={name.trim().length < 2 || send.isPending} onClick={() => send.mutate(() => fn({ data: { id: a.id, name: name.trim(), note: note.trim() || undefined } }), { onSuccess: (r) => { if (r.ok) { setOpen(false); setName(""); setNote(""); } } })}>{send.isPending ? "Sending…" : "Add and email the client"}</Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </div>
  );
}

/** Less common actions, kept out of the way (magnific.com "…" menu pattern). */
export function MoreActions({ a, onClosed }: { a: Appt; onClosed: () => void }) {
  const link = useServerFn(resendPortalLink), cancel = useServerFn(ownerCancelAppointment), rebook = useServerFn(sendRebookLink);
  const send = useSend();
  const [confirm, setConfirm] = useState(false);
  const [note, setNote] = useState("");
  const open = a.status === "booked" || a.status === "confirmed";
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild><Button size="icon" variant="secondary" aria-label="More actions" className="shrink-0"><MoreHorizontal /></Button></DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top" className="w-60">
          <DropdownMenuItem onSelect={() => send.mutate(() => link({ data: { id: a.id } }))}>Resend the appointment link</DropdownMenuItem>
          {a.status === "no_show" && <DropdownMenuItem onSelect={() => send.mutate(() => rebook({ data: { id: a.id } }))}>Send a rebooking link</DropdownMenuItem>}
          {open && <><DropdownMenuSeparator /><DropdownMenuItem onSelect={() => setConfirm(true)} className="text-alert-negative-fg focus:text-alert-negative-fg">Cancel appointment…</DropdownMenuItem></>}
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-medium">Cancel {a.clients?.name}'s appointment?</AlertDialogTitle>
            <AlertDialogDescription>They get an email with a link to pick a new time, and the waitlist is offered the slot.</AlertDialogDescription>
          </AlertDialogHeader>
          <Input aria-label="Note to the client (optional)" placeholder="Note to the client (optional)" value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} />
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction className="bg-alert-negative text-alert-negative-fg hover:bg-[#FCE1DB]" onClick={() => send.mutate(() => cancel({ data: { id: a.id, note: note.trim() || undefined } }), { onSuccess: (r) => { if (r.ok) onClosed(); } })}>Cancel appointment</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
