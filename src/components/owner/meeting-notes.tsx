import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bot, ChevronRight, Copy } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Tag } from "@/components/ui/tag";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { fmtStamp, type Appt } from "./lib";

type Line = { speaker: string; t: number; text: string };
type Action = { who: string; text: string };

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/** Notetaker for video calls: joins automatically, then leaves a summary, next steps and transcript. */
export function MeetingNotes({ a, now }: { a: Appt; now: string }) {
  const [open, setOpen] = useState(false);
  const q = useQuery({
    queryKey: ["owner", "notes", a.id],
    enabled: a.meeting_type === "video",
    queryFn: async () => (await supabase.from("meeting_notes").select("*").eq("appointment_id", a.id).maybeSingle()).data,
  });
  if (a.meeting_type !== "video" || a.status === "cancelled" || a.status === "rescheduled") return null;
  const upcoming = Date.parse(a.end_at) > Date.parse(now);

  const head = (right?: React.ReactNode) => (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <span className="grid size-8 place-items-center rounded-lg bg-fill-neutral text-deep-ink"><Bot className="size-4" /></span>
        <div><h3 className="t-sub">Meeting notes</h3><p className="text-xs text-muted-foreground">Hartwell Notetaker</p></div>
      </div>
      {right}
    </div>
  );

  if (q.isLoading) return <section className="border-b border-border px-6 py-5"><Skeleton className="h-8 w-40" /><Skeleton className="mt-3 h-16 w-full rounded-xl" /></section>;
  const n = q.data;

  if (!n) return (
    <section className="border-b border-border px-6 py-5">
      {head(<Tag tone="neutral">{upcoming ? "Will join" : "Processing"}</Tag>)}
      <p className="mt-3 text-sm text-muted-foreground">{upcoming ? "The notetaker joins this video call automatically. A summary, next steps and the transcript appear here a few minutes after the call ends." : "Writing up the summary and transcript. This usually takes a few minutes."}</p>
    </section>
  );

  if (n.status === "no_show") return (
    <section className="border-b border-border px-6 py-5">
      {head(<Tag tone="warning">No one joined</Tag>)}
      <p className="mt-3 text-sm text-muted-foreground">{n.summary}</p>
    </section>
  );

  const points = (n.key_points ?? []) as string[];
  const actions = (n.action_items ?? []) as Action[];
  const lines = (n.transcript ?? []) as Line[];
  const copy = () => {
    const txt = [n.summary, "", ...points.map((p) => `- ${p}`), "", "Next steps:", ...actions.map((x) => `- ${x.who}: ${x.text}`)].join("\n");
    void navigator.clipboard.writeText(txt).then(() => toast.success("Notes copied."));
  };

  return (
    <section className="border-b border-border px-6 py-5">
      {head(<Button size="sm" variant="ghost" onClick={copy}><Copy className="size-3.5" />Copy</Button>)}
      <p className="mt-1 pl-[42px] text-xs text-muted-foreground">{fmtStamp(n.recorded_at)}{n.duration_min ? `, ${n.duration_min} min` : ""}</p>
      <p className="mt-3 text-sm leading-[22px] text-body">{n.summary}</p>
      {points.length > 0 && <>
        <p className="mt-4 t-label">Key points</p>
        <ul className="mt-1.5 space-y-1">{points.map((p) => <li key={p} className="flex gap-2 text-sm text-body"><span className="mt-[9px] size-1 shrink-0 rounded-full bg-deep-ink" />{p}</li>)}</ul>
      </>}
      {actions.length > 0 && <>
        <p className="mt-4 t-label">Next steps</p>
        <ul className="mt-1.5 divide-y divide-line-1 overflow-hidden rounded-xl border border-line-1">
          {actions.map((x) => <li key={x.text} className="flex items-center gap-2 px-3 py-1.5 text-sm"><Tag tone={x.who === "Claire" ? "info" : "neutral"}>{x.who}</Tag><span className="min-w-0 text-deep-ink">{x.text}</span></li>)}
        </ul>
      </>}
      {lines.length > 0 && (
        <div className="mt-4">
          <button type="button" onClick={() => setOpen((v) => !v)} className="flex min-h-9 items-center gap-1 text-[13px] font-medium text-deep-ink">
            <ChevronRight className={cn("size-4 text-muted-foreground transition-transform duration-150", open && "rotate-90")} />Transcript
          </button>
          {open && <ol className="mt-2 max-h-80 space-y-3 overflow-y-auto rounded-xl bg-surface-2 p-3">
            {lines.map((l, i) => (
              <li key={i} className="text-sm">
                <p className="text-xs"><span className="font-medium text-deep-ink">{l.speaker}</span><span className="tabular ml-2 text-muted-foreground">{mmss(l.t)}</span></p>
                <p className="mt-0.5 leading-[22px] text-body">{l.text}</p>
              </li>
            ))}
          </ol>}
        </div>
      )}
    </section>
  );
}
