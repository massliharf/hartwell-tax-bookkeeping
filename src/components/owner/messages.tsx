import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronDown, Mail, MessageSquare } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { MSG_LABEL, fmtStamp } from "./lib";
import { ErrorNote, LoadingRows } from "./ui";
import { cn } from "@/lib/utils";

/** Every automatic email and text, newest first. Same row style as the rest of the app. */
export function MessageLog() {
  const [type, setType] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [limit, setLimit] = useState(20);
  const q = useQuery({
    queryKey: ["owner", "outbox"],
    queryFn: async () => {
      const { data, error } = await supabase.from("messages")
        .select("id, type, channel, subject, body, sent_at, minutes_saved, recipient, delivery, client_id, clients(name)")
        .order("sent_at", { ascending: false }).limit(300);
      if (error) throw error;
      return data ?? [];
    },
  });
  const types = Array.from(new Set((q.data ?? []).map((m) => m.type)));
  const list = (q.data ?? []).filter((m) => !type || m.type === type);
  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-medium text-deep-ink">Sent automatically</h2>
        <Segmented size="sm" label="Filter messages" value={type ?? "all"} onChange={(v) => setType(v === "all" ? null : v)}
          options={[{ value: "all", label: "All" }, ...types.map((t) => ({ value: t, label: MSG_LABEL[t] ?? t }))]} className="max-w-full" />
      </div>
      {q.isLoading && <LoadingRows n={5} />}
      {q.isError && <ErrorNote onRetry={() => q.refetch()} />}
      {q.data && !list.length && <p className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">Nothing sent yet.</p>}
      {!!list.length && (
        <ul className="overflow-hidden rounded-2xl border border-border">
          {list.slice(0, limit).map((m) => (
            <li key={m.id} className="border-b border-border last:border-0">
              <button onClick={() => setOpen(open === m.id ? null : m.id)} className="flex min-h-14 w-full items-center gap-3 px-3 py-2 text-left transition-colors duration-150 hover:bg-surface-2">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-fill-neutral text-deep-ink">{m.channel === "sms" ? <MessageSquare className="size-4" /> : <Mail className="size-4" />}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-deep-ink">{m.subject ?? MSG_LABEL[m.type]}</span>
                  <span className="block truncate text-xs text-muted-foreground">{(m.clients as { name: string } | null)?.name ?? m.recipient ?? "Visitor"}, {fmtStamp(m.sent_at)}{m.channel === "sms" && ", text (simulated)"}{m.delivery === "failed" && <span className="text-destructive">, not delivered</span>}</span>
                </span>
                {m.minutes_saved > 0 && <span className="tabular hidden shrink-0 text-xs text-muted-foreground sm:block">{m.minutes_saved} min saved</span>}
                <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform duration-150", open === m.id && "rotate-180")} />
              </button>
              {open === m.id && (
                <div className="border-t border-border bg-surface-2 px-4 py-4">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-[22px] text-deep-ink/80">{m.body}</pre>
                  {m.client_id && <Button asChild size="sm" variant="secondary" className="mt-3"><Link to="/owner/clients/$id" params={{ id: m.client_id }}>Open client</Link></Button>}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {list.length > limit && <Button size="sm" variant="ghost" className="mt-2" onClick={() => setLimit((l) => l + 20)}>Show more</Button>}
    </section>
  );
}
