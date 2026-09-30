import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronRight, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { ErrorNote, LoadingRows, PageHead } from "@/components/owner/ui";

export const Route = createFileRoute("/_authenticated/owner/clients/")({ head: () => ({ meta: [{ title: "Clients — Hartwell Tax & Bookkeeping" }, { name: "robots", content: "noindex" }] }), component: Clients });

function Clients() {
  const [term, setTerm] = useState("");
  const q = useQuery({
    queryKey: ["owner", "clients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("id, name, email, phone, is_returning, appointments(start_at, status)").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
  const t = term.trim().toLowerCase();
  const list = (q.data ?? []).filter((c) => !t || c.name.toLowerCase().includes(t) || c.email.toLowerCase().includes(t) || (c.phone ?? "").includes(t));

  return (
    <>
      <PageHead title="Clients">
        {q.data && <p className="tabular">{q.data.length} clients</p>}
      </PageHead>
      <div className="relative mb-6">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Search by name, email or phone" className="h-9 rounded-lg bg-sheet pl-10 text-sm" />
      </div>
      {q.isLoading && <LoadingRows n={5} />}
      {q.isError && <ErrorNote onRetry={() => q.refetch()} />}
      {q.data && !list.length && <p className="py-10 text-center text-sm text-muted-foreground">No one matches "{term}".</p>}
      <ul className="overflow-hidden rounded-2xl border border-border">
        {list.map((c) => {
          const appts = (c.appointments ?? []).filter((a) => a.status !== "cancelled").sort((a, b) => b.start_at.localeCompare(a.start_at));
          return (
            <li key={c.id} className="border-b border-border last:border-0">
              <Link to="/owner/clients/$id" params={{ id: c.id }} className="flex min-h-14 w-full items-center gap-3 px-3 py-2 text-left transition-colors duration-150 hover:bg-surface-2">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-fill-neutral text-xs font-medium text-deep-ink">{c.name.charAt(0)}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-deep-ink">{c.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">{c.email}</span>
                </span>
                <span className="tabular hidden text-right text-xs text-muted-foreground sm:block">
                  {(() => {
                    const nowIso = new Date().toISOString();
                    const next = appts.filter((a) => a.start_at >= nowIso).sort((a, b) => a.start_at.localeCompare(b.start_at))[0];
                    const last = appts.find((a) => a.start_at < nowIso);
                    const d = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/New_York" });
                    return next ? <>Next: <span className="text-deep-ink">{d(next.start_at)}</span></> : last ? <>Last: {d(last.start_at)}</> : "No appointments";
                  })()}{c.is_returning ? ", Returning" : ""}
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
