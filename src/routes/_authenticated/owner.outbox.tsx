import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Mail, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MSG_LABEL, fmtStamp } from "@/components/owner/lib";
import { Empty, ErrorNote, LoadingRows, PageHead } from "@/components/owner/ui";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/owner/outbox")({ head: () => ({ meta: [{ title: "Outbox — Patel Tax & Bookkeeping" }] }), component: Outbox });

function Outbox() {
  const [type, setType] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const q = useQuery({
    queryKey: ["owner", "outbox"],
    queryFn: async () => {
      const { data, error } = await supabase.from("messages")
        .select("id, type, channel, subject, body, sent_at, minutes_saved, recipient, delivery, clients(name)")
        .order("sent_at", { ascending: false }).limit(300);
      if (error) throw error;
      return data ?? [];
    },
  });
  const types = Array.from(new Set((q.data ?? []).map((m) => m.type)));
  const list = (q.data ?? []).filter((m) => !type || m.type === type);

  return (
    <>
      <PageHead eyebrow="Outbox" title="Sent on your behalf">
        <p>Every email and text the practice sent automatically.</p>
      </PageHead>
      <div className="mb-6 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        {[null, ...types].map((t) => (
          <button key={t ?? "all"} onClick={() => setType(t)}
            className={cn("shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition-colors", type === t ? "border-ink bg-ink text-primary-foreground" : "border-border bg-sheet text-deep-ink hover:border-ink/40")}>
            {t ? MSG_LABEL[t] ?? t : "All"}
          </button>
        ))}
      </div>
      {q.isLoading && <LoadingRows n={5} />}
      {q.isError && <ErrorNote onRetry={() => q.refetch()} />}
      {q.data && !list.length && <Empty title="Nothing sent yet.">Messages appear here the moment they go out.</Empty>}
      <ul className="space-y-3">
        {list.map((m) => (
          <li key={m.id} className="rounded-[14px] border border-border bg-sheet shadow-sheet">
            <button onClick={() => setOpen(open === m.id ? null : m.id)} className="flex w-full items-start gap-4 p-4 text-left">
              <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-sage text-ink">
                {m.channel === "sms" ? <MessageSquare className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-deep-ink">{m.subject ?? MSG_LABEL[m.type]}</span>
                <span className="block truncate text-sm text-muted-foreground">
                  {(m.clients as { name: string } | null)?.name ?? m.recipient ?? "Visitor"} · {fmtStamp(m.sent_at)}
                  {m.delivery === "failed" && <span className="text-destructive"> · Not delivered</span>}
                  {m.channel === "sms" && " · Text (simulated)"}
                </span>
              </span>
              {m.minutes_saved > 0 && <span className="tabular shrink-0 rounded-full bg-marigold/20 px-2.5 py-1 text-xs font-medium text-deep-ink">saved {m.minutes_saved} min</span>}
            </button>
            {open === m.id && <pre className="whitespace-pre-wrap border-t border-border px-5 py-4 font-sans text-sm text-deep-ink/80">{m.body}</pre>}
          </li>
        ))}
      </ul>
    </>
  );
}
