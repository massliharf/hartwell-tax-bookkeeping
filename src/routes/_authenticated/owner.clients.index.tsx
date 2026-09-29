import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { ErrorNote, LoadingRows, PageHead } from "@/components/owner/ui";

export const Route = createFileRoute("/_authenticated/owner/clients/")({ head: () => ({ meta: [{ title: "Clients — Patel Tax & Bookkeeping" }] }), component: Clients });

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
      <PageHead eyebrow="Clients" title="Everyone you work with">
        {q.data && <p className="tabular">{q.data.length} clients</p>}
      </PageHead>
      <div className="relative mb-6">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Search by name, email or phone" className="h-12 rounded-full bg-sheet pl-11" />
      </div>
      {q.isLoading && <LoadingRows n={5} />}
      {q.isError && <ErrorNote onRetry={() => q.refetch()} />}
      {q.data && !list.length && <p className="py-10 text-center text-sm text-muted-foreground">No one matches "{term}".</p>}
      <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-sheet shadow-sheet">
        {list.map((c) => {
          const appts = (c.appointments ?? []).filter((a) => a.status !== "cancelled").sort((a, b) => b.start_at.localeCompare(a.start_at));
          return (
            <li key={c.id}>
              <Link to="/owner/clients/$id" params={{ id: c.id }} className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-paper">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sage font-serif text-lg text-ink">{c.name.charAt(0)}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-deep-ink">{c.name}</span>
                  <span className="block truncate text-sm text-muted-foreground">{c.email}</span>
                </span>
                <span className="tabular hidden text-right text-xs text-muted-foreground sm:block">
                  {appts.length} appointment{appts.length === 1 ? "" : "s"}{c.is_returning ? " · Returning" : ""}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
