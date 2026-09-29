import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { ErrorNote, LoadingRows, PageHead } from "@/components/owner/ui";

export const Route = createFileRoute("/_authenticated/owner/clients/")({ head: () => ({ meta: [{ title: "Clients — Patel Tax & Bookkeeping" }, { name: "description", content: "Search and review practice clients." }, { property: "og:title", content: "Clients — Patel Tax & Bookkeeping" }, { property: "og:description", content: "Search and review practice clients." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }), component: Clients });

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
       <ul className="divide-y divide-line overflow-hidden rounded-[14px] border border-line bg-paper">
        {list.map((c) => {
          const appts = (c.appointments ?? []).filter((a) => a.status !== "cancelled").sort((a, b) => b.start_at.localeCompare(a.start_at));
          return (
            <li key={c.id}>
               <Link to="/owner/clients/$id" params={{ id: c.id }} className="flex min-h-14 items-center gap-4 px-5 py-2 transition-colors hover:bg-control">
                 <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-evergreen-tint text-sm font-semibold text-evergreen">{c.name.charAt(0)}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-deep-ink">{c.name}</span>
                  <span className="block truncate text-sm text-muted-foreground">{c.email}</span>
                </span>
                <span className="tabular hidden text-right text-xs text-muted-foreground sm:block">
                   {appts.length} appointment{appts.length === 1 ? "" : "s"}{c.is_returning ? ", Returning" : ""}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
