import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AlertTriangle, CalendarClock, MailX, PenLine, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOwnerCtx } from "@/components/owner/ctx";
import { fmtDay, fmtStamp, fmtTime, missingOf, needsYou, type NeedItem } from "@/components/owner/lib";
import { Empty, ErrorNote, LoadingRows, PageHead } from "@/components/owner/ui";
import { dismissAttention, nudgeSignature } from "@/lib/owner.functions";

export const Route = createFileRoute("/_authenticated/owner/needs")({ head: () => ({ meta: [{ title: "Needs you — Hartwell Tax & Bookkeeping" }, { name: "robots", content: "noindex" }] }), component: Needs });

function Needs() {
  const now = useOwnerCtx().data!.now;
  const q = useQuery(needsYou(now));
  const qc = useQueryClient();
  const dismiss = useServerFn(dismissAttention);
  const nudge = useServerFn(nudgeSignature);
  const refresh = () => qc.invalidateQueries({ queryKey: ["owner"] });
  const act = useMutation({
    mutationFn: async (it: NeedItem) => {
      if (it.kind === "signature") return nudge({ data: { id: it.id } });
      const kind = it.kind === "low" ? "appointment" : it.kind === "failed" ? "message" : "offer";
      return dismiss({ data: { kind, id: it.id } });
    },
    onSuccess: (_r, it) => { toast.success(it.kind === "signature" ? "Reminder sent." : "Done."); refresh(); },
    onError: () => toast.error("Couldn't do that. Try again."),
  });

  return (
    <>
      <PageHead eyebrow="The only list you need" title="Needs you">
        <p>Everything else is handled automatically.</p>
      </PageHead>
      {q.isLoading && <LoadingRows />}
      {q.isError && <ErrorNote onRetry={() => q.refetch()} />}
      {q.data && !q.data.length && <Empty title="Nothing needs you right now.">Reminders, confirmations and the waitlist are running on their own. Enjoy the quiet.</Empty>}
      <ul className="space-y-4">
        {q.data?.map((it) => <Row key={`${it.kind}-${it.id}`} it={it} busy={act.isPending && act.variables?.id === it.id} onAct={() => act.mutate(it)} />)}
      </ul>
    </>
  );
}

function Row({ it, onAct, busy }: { it: NeedItem; onAct: () => void; busy: boolean }) {
  const shell = (icon: React.ReactNode, tone: string, title: React.ReactNode, body: React.ReactNode, action: string, secondary?: React.ReactNode) => (
    <li className="sheet-stack flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${tone}`}>{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-deep-ink">{title}</p>
        <div className="mt-0.5 text-sm text-muted-foreground">{body}</div>
      </div>
      <div className="flex gap-2">{secondary}<Button size="sm" onClick={onAct} disabled={busy}>{action}</Button></div>
    </li>
  );
  if (it.kind === "low") {
    const a = it.appt;
    const miss = missingOf(a);
    return shell(<AlertTriangle className="h-5 w-5" />, "bg-warning/10 text-warning",
      <>{a.clients?.name}, {a.ready_score}% ready</>,
      <>{a.services?.name}, {fmtDay(a.start_at)} at {fmtTime(a.start_at)}. Missing {miss.map((m) => m.document_name).join(", ") || "nothing required"}. They were offered later times.</>,
      "Keep as is",
      a.clients && <Button size="sm" variant="outline" asChild><Link to="/owner/clients/$id" params={{ id: a.clients.id }}>Contact</Link></Button>);
  }
  if (it.kind === "signature") {
    const a = it.appt;
    return shell(<PenLine className="h-5 w-5" />, "bg-marigold/15 text-warning",
      <>{a.clients?.name} hasn't signed Form 8879</>,
      <>Appointment was {fmtDay(a.start_at)}. Automatic reminders already went out.</>, "Send another reminder");
  }
  if (it.kind === "failed") {
    return shell(<MailX className="h-5 w-5" />, "bg-destructive/10 text-destructive",
      <>An email didn't arrive: {it.msg.subject}</>,
      <>To {it.msg.recipient} on {fmtStamp(it.msg.sent_at)}. Check the address with the client.</>, "Got it");
  }
  return shell(<Sparkles className="h-5 w-5" />, "bg-success/10 text-success",
    <>{it.offer.name} took a freed slot</>,
    <>{it.offer.service}, {fmtDay(it.offer.slot_start)} at {fmtTime(it.offer.slot_start)}. Just so you know, nothing to do.</>, "Got it",
    <span className="hidden items-center text-xs text-muted-foreground sm:flex"><CalendarClock className="mr-1 h-3.5 w-3.5" />FYI</span>);
}
