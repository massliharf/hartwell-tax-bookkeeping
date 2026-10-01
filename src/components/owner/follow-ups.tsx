import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Check, Clock, FilePlus2, Minus, MoreHorizontal, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { bookFollowUpMeeting, nudgeSignature, ownerCancelAppointment, ownerMoveAppointment, remindPayment, requestExtraDocument, resendPortalLink, sendApptReminder, sendDocsReminder, sendRebookLink } from "@/lib/owner.functions";
import { MSG_LABEL, fmtDay, fmtStamp, missingOf, type Appt } from "./lib";
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

  // What the automation will do next for this client, and what it already did. Milestones (uploads, meeting,
  // signature, payment) live in their own sections above, so this stays short.
  const next = steps.filter((x) => x.state === "scheduled" || x.state === "due" || (x.action && x.state === "sent" && x.key !== "confirm"));
  const sentMsgs = msgs.data ?? [];
  return (
    <section className="border-t border-border px-6 py-5">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="t-sub">Handled for you</h3>
        <span className="text-xs text-muted-foreground">{sentMsgs.length} message{sentMsgs.length === 1 ? "" : "s"} sent</span>
      </div>
      {next.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">Nothing else is scheduled for this client.</p>
      ) : (
        <ul className="mt-3 divide-y divide-line-1 overflow-hidden rounded-xl border border-line-1">
          {next.slice(0, 4).map((x) => (
            <li key={x.key} className="flex min-h-12 items-center gap-3 px-3 py-2">
              <Clock className="size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] text-deep-ink">{x.label}</p>
                <p className="text-[11px] text-muted-foreground">{x.state === "scheduled" ? `Goes out ${x.at ? fmtDay(x.at) : "on its own"}` : x.state === "due" ? "Goes out with the next run" : `Last sent ${x.at ? fmtDay(x.at) : ""}`}{x.note ? `. ${x.note}` : ""}</p>
              </div>
              {x.action && <Button size="sm" variant="ghost" disabled={send.isPending} onClick={() => send.mutate(x.action!.run)}>{x.state === "sent" ? "Send again" : x.action.label}</Button>}
            </li>
          ))}
        </ul>
      )}
      {sentMsgs.length > 0 && (
        <details className="group mt-3">
          <summary className="flex min-h-10 cursor-pointer list-none items-center gap-1.5 text-[13px] font-medium text-ink [&::-webkit-details-marker]:hidden">
            <ChevronRight className="size-4 transition-transform duration-200 group-open:rotate-90" />See what was sent
          </summary>
          <ul className="mt-1 space-y-1.5 pl-6">
            {[...sentMsgs].reverse().map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 text-[13px]"><span className="text-deep-ink">{MSG_LABEL[m.type] ?? "Message"}</span><span className="tabular text-xs text-muted-foreground">{fmtStamp(m.sent_at)}</span></li>
            ))}
          </ul>
        </details>
      )}
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
