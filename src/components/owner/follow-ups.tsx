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
import { bookFollowUpMeeting, nudgeSignature, ownerCancelAppointment, ownerMoveAppointment, remindPayment, requestExtraDocument, resendPortalLink, sendApptReminder, sendDocsReminder, sendRebookLink } from "@/lib/owner.functions";
import { MSG_LABEL, fmtDay, fmtStamp, missingOf, money, type Appt } from "./lib";
import { stageOf } from "@/lib/lifecycle";
import { useApptActions } from "./ui";
import { SlotPicker } from "./new-appointment";
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
  }
  if (a.status === "no_show") {
    steps.push({ key: "rebook", label: "Rebooking link", state: last("reschedule_offer") ? "sent" : "due", at: last("reschedule_offer"),
      action: { label: "Send now", run: () => fns.rebook({ data: { id: a.id } }) } });
  }

  // Past: milestones from the appointment itself plus every message that went out, oldest first.
  type Ev = { at: string; label: string; detail?: string | undefined; tone?: "done" | "warn" | undefined };
  const past: Ev[] = [];
  if (a.created_at) past.push({ at: a.created_at, label: "Booked", detail: a.services?.name });
  for (const i of a.checklist_items) if (i.uploaded_at && i.status === "uploaded") past.push({ at: i.uploaded_at, label: `${i.document_name} uploaded`, detail: i.review_status === "needs_fix" ? "Fix requested" : i.review_status === "accepted" ? (i.ai_check === "ok" ? "Auto-checked" : "Accepted") : undefined, tone: i.review_status === "needs_fix" ? "warn" : undefined });
  for (const m of msgs.data ?? []) past.push({ at: m.sent_at, label: MSG_LABEL[m.type] ?? "Message", detail: "Email to the client" });
  if (Date.parse(a.end_at) <= t && a.status !== "cancelled") past.push({ at: a.start_at, label: a.status === "no_show" ? "Missed the appointment" : "Met with Claire", tone: a.status === "no_show" ? "warn" : undefined });
  if (a.finished_at) past.push({ at: a.finished_at, label: "Return finished", detail: a.fee_cents != null ? `Fee ${money(a.fee_cents)}` : undefined });
  if (a.signed_at) past.push({ at: a.signed_at, label: "Form 8879 signed" });
  if (a.paid_at) past.push({ at: a.paid_at, label: "Paid", detail: a.paid_method === "in_office" ? "In the office" : a.paid_method === "test" ? "Test payment" : "By card" });
  if (a.filed_at) past.push({ at: a.filed_at, label: "E-filed" });
  past.sort((x, y) => x.at.localeCompare(y.at));
  const [allPast, setAllPast] = useState(false);
  const shownPast = allPast ? past : past.slice(-5);

  // Next: what goes out on its own and what Claire can send now, soonest first, then the milestones still ahead.
  const next = steps.filter((s) => s.state === "scheduled" || s.state === "due" || (s.action && s.state === "sent" && s.key !== "confirm"));
  const st = stageOf(a, now);
  const ahead: Ev[] = [];
  if (st === "documents" || st === "ready") ahead.push({ at: a.start_at, label: a.meeting_type === "video" ? "Video call with Claire" : "Meeting with Claire" });
  if (st === "documents" || st === "ready" || st === "meeting" || st === "wrap_up") ahead.push({ at: "", label: "Finish the return", detail: "The client gets the review, sign and pay email" });
  if (st === "documents" || st === "ready" || st === "meeting" || st === "wrap_up") ahead.push({ at: "", label: "Client signs and pays", detail: "Form 8879 and the fee, from their page" });
  if (st !== "filed" && st !== "cancelled" && st !== "no_show") ahead.push({ at: "", label: "File the return", detail: st === "to_file" ? "Signed and paid. Mark it filed when it's submitted" : "Once it's signed and paid; the client is emailed" });

  const dot = (tone: "done" | "warn" | "next" | "later") => <span className={cn("relative z-[1] mt-1 size-2.5 shrink-0 rounded-full ring-4 ring-sheet", tone === "done" ? "bg-ink" : tone === "warn" ? "bg-[#E7AD16]" : tone === "next" ? "border-2 border-ink bg-sheet" : "border-2 border-line-2 bg-sheet")} />;
  return (
    <section className="border-t border-border px-6 py-5">
      <h3 className="t-sub">Timeline</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">Everything that happened, in order, and what happens next. Messages go out on their own; send any of them now if you'd rather not wait.</p>
      <ol className="relative mt-4 space-y-3 before:absolute before:bottom-1 before:left-[4.5px] before:top-1 before:w-px before:bg-line-1">
        {past.length > 5 && !allPast && <li><button type="button" onClick={() => setAllPast(true)} className="ml-6 text-xs font-medium text-ink hover:underline">Show {past.length - 5} earlier</button></li>}
        {shownPast.map((e, i) => (
          <li key={`${e.at}-${e.label}-${i}`} className="flex gap-3.5">
            {dot(e.tone === "warn" ? "warn" : "done")}
            <div className="min-w-0 flex-1 text-[13px]"><p className="text-deep-ink">{e.label}{e.detail && <span className="text-muted-foreground"> · {e.detail}</span>}</p><p className="tabular text-[11px] text-muted-foreground">{fmtStamp(e.at)}</p></div>
          </li>
        ))}
        {(next.length > 0 || ahead.length > 0) && <li className="flex items-center gap-3.5"><span className="relative z-[1] ml-[-2px] rounded-full bg-sheet px-0 text-[10px] font-semibold uppercase tracking-[0.06em] text-ink">Now</span></li>}
        {next.map((s) => (
          <li key={s.key} className="flex gap-3.5">
            {dot("next")}
            <div className="min-w-0 flex-1 text-[13px]">
              <p className="text-deep-ink">{s.label}</p>
              <p className="text-[11px] text-muted-foreground">{s.state === "scheduled" ? `Goes out on its own ${s.at ? fmtDay(s.at) : ""}` : s.state === "due" ? "Goes out with the next run" : `Last sent ${s.at ? fmtDay(s.at) : ""}`}{s.note ? `. ${s.note}` : ""}</p>
            </div>
            {s.action && <Button size="sm" variant="ghost" className="-my-1" disabled={send.isPending} onClick={() => send.mutate(s.action!.run)}>{s.state === "sent" ? "Send again" : s.action.label}</Button>}
          </li>
        ))}
        {ahead.map((e) => (
          <li key={e.label} className="flex gap-3.5">
            {dot("later")}
            <div className="min-w-0 flex-1 text-[13px]"><p className="text-muted-foreground">{e.label}</p><p className="text-[11px] text-muted-foreground">{e.at ? fmtStamp(e.at) : e.detail}</p></div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** "Needs another meeting" (after the meeting) or "Reschedule" (before it): pick a time, the client is emailed. */
export function MeetingPicker({ a, mode, onBack, onDone }: { a: Appt; mode: "move" | "follow_up"; onBack: () => void; onDone: () => void }) {
  const follow = useServerFn(bookFollowUpMeeting), move = useServerFn(ownerMoveAppointment);
  const [slot, setSlot] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const send = useSend();
  const first = a.clients?.name.split(" ")[0] ?? "the client";
  return (
    <div className="space-y-4">
      <div>
        <h3 className="t-sub">{mode === "follow_up" ? "Book the next meeting" : "Reschedule"}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{mode === "follow_up" ? `Out of time? Pick when to continue. ${first}'s documents and answers carry over, and ${first} is emailed the new time.` : `${first} is emailed the new time. Documents and answers stay with the appointment.`}</p>
      </div>
      <SlotPicker serviceId={a.service_id} value={slot} onChange={setSlot} />
      {mode === "follow_up" && <Input aria-label="Note to the client (optional)" placeholder="Note to the client (optional), e.g. bring the 1099-B from Schwab" value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} />}
      <div className="flex gap-2">
        <Button variant="secondary" onClick={onBack}>Back</Button>
        <Button disabled={!slot || send.isPending} onClick={() => slot && send.mutate(
          () => mode === "follow_up" ? follow({ data: { id: a.id, start: slot, note: note.trim() || undefined } }) : move({ data: { id: a.id, start: slot } }).then((r) => ({ ok: r.ok, message: r.ok ? `Moved. ${first} has been emailed the new time.` : r.error ?? "That time isn't free." })),
          { onSuccess: (r) => { if (r.ok) onDone(); } })}>
          {send.isPending ? "Saving…" : mode === "follow_up" ? "Book and email" : "Move and email"}
        </Button>
      </div>
    </div>
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
export function MoreActions({ a, onClosed, canNoShow = false }: { a: Appt; onClosed: () => void; canNoShow?: boolean }) {
  const link = useServerFn(resendPortalLink), cancel = useServerFn(ownerCancelAppointment), rebook = useServerFn(sendRebookLink);
  const send = useSend();
  const [confirm, setConfirm] = useState(false);
  const [noShowAsk, setNoShowAsk] = useState(false);
  const { noShow } = useApptActions();
  const [note, setNote] = useState("");
  const open = a.status === "booked" || a.status === "confirmed";
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild><Button size="icon" variant="secondary" aria-label="More actions" className="shrink-0"><MoreHorizontal /></Button></DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top" className="w-60">
          {a.manage_token && <DropdownMenuItem onSelect={() => window.open(`/a/${a.manage_token}`, "_blank", "noopener")}>See the client's page</DropdownMenuItem>}
          <DropdownMenuItem onSelect={() => send.mutate(() => link({ data: { id: a.id } }))}>Resend the appointment link</DropdownMenuItem>
          {a.status === "no_show" && <DropdownMenuItem onSelect={() => send.mutate(() => rebook({ data: { id: a.id } }))}>Send a rebooking link</DropdownMenuItem>}
          {canNoShow && <DropdownMenuItem onSelect={() => setNoShowAsk(true)} className="text-alert-negative-fg focus:text-alert-negative-fg">Mark as no-show…</DropdownMenuItem>}
          {open && <><DropdownMenuSeparator /><DropdownMenuItem onSelect={() => setConfirm(true)} className="text-alert-negative-fg focus:text-alert-negative-fg">Cancel appointment…</DropdownMenuItem></>}
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog open={noShowAsk} onOpenChange={setNoShowAsk}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Mark {a.clients?.name} as a no-show?</AlertDialogTitle>
            <AlertDialogDescription>The appointment is closed. You can send a rebooking link from this menu afterwards.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it open</AlertDialogCancel>
            <AlertDialogAction className="bg-alert-negative text-alert-negative-fg hover:bg-[#FCE1DB] active:bg-[#F9C7BE]" onClick={() => noShow.mutate(a.id, { onSuccess: () => onClosed() })}>Mark no-show</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel {a.clients?.name}'s appointment?</AlertDialogTitle>
            <AlertDialogDescription>They get an email with a link to pick a new time, and the waitlist is offered the slot.</AlertDialogDescription>
          </AlertDialogHeader>
          <Input aria-label="Note to the client (optional)" placeholder="Note to the client (optional)" value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} />
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction className="bg-alert-negative text-alert-negative-fg hover:bg-[#FCE1DB] active:bg-[#F9C7BE]" onClick={() => send.mutate(() => cancel({ data: { id: a.id, note: note.trim() || undefined } }), { onSuccess: (r) => { if (r.ok) onClosed(); } })}>Cancel appointment</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
