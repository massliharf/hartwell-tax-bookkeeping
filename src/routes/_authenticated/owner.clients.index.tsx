import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ChevronRight, Mail, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";
import { Empty, ErrorNote, LoadingRows } from "@/components/owner/ui";
import { useOwnerCtx } from "@/components/owner/ctx";

export const Route = createFileRoute("/_authenticated/owner/clients/")({ head: () => ({ meta: [{ title: "Clients — Hartwell Tax & Bookkeeping" }, { name: "robots", content: "noindex" }] }), component: Clients });

type A = { start_at: string; status: string; ready_score: number; fee_cents: number | null; paid_at: string | null; filed_at: string | null };
type Row = { id: string; name: string; email: string; phone: string | null; is_returning: boolean; appointments: A[] | null };
type Filter = "all" | "upcoming" | "missing" | "unpaid" | "filed" | "new";

const d = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/New_York" });

/** Library pattern from magnific.com: title + count, search and filter chips, rows with a status column and hover actions. */
function Clients() {
  const now = useOwnerCtx().data?.now ?? new Date().toISOString();
  const [term, setTerm] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const q = useQuery({
    queryKey: ["owner", "clients", "library"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("id, name, email, phone, is_returning, appointments(start_at, status, ready_score, fee_cents, paid_at, filed_at)").order("name");
      if (error) throw error;
      return (data ?? []) as unknown as Row[];
    },
  });

  const rows = useMemo(() => (q.data ?? []).map((c) => {
    const appts = (c.appointments ?? []).filter((a) => a.status !== "cancelled");
    const next = appts.filter((a) => (a.status === "booked" || a.status === "confirmed") && a.start_at >= now).sort((a, b) => a.start_at.localeCompare(b.start_at))[0];
    const last = appts.filter((a) => a.start_at < now).sort((a, b) => b.start_at.localeCompare(a.start_at))[0];
    const unpaid = appts.some((a) => a.status === "completed" && a.fee_cents != null && !a.paid_at);
    const filed = appts.some((a) => !!a.filed_at);
    return { ...c, next, last, unpaid, filed, missing: !!next && next.ready_score < 100 };
  }), [q.data, now]);

  const counts: Record<Filter, number> = {
    all: rows.length, upcoming: rows.filter((r) => r.next).length, missing: rows.filter((r) => r.missing).length,
    unpaid: rows.filter((r) => r.unpaid).length, filed: rows.filter((r) => r.filed).length, new: rows.filter((r) => !r.is_returning).length,
  };
  const chips: [Filter, string][] = [["all", "All"], ["upcoming", "Upcoming"], ["missing", "Missing documents"], ["unpaid", "Unpaid"], ["filed", "Filed"], ["new", "New this season"]];
  const t = term.trim().toLowerCase();
  const list = rows
    .filter((r) => filter === "all" || (filter === "upcoming" && r.next) || (filter === "missing" && r.missing) || (filter === "unpaid" && r.unpaid) || (filter === "filed" && r.filed) || (filter === "new" && !r.is_returning))
    .filter((r) => !t || r.name.toLowerCase().includes(t) || r.email.toLowerCase().includes(t) || (r.phone ?? "").includes(t));

  return (
    <>
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="t-owner text-deep-ink">Clients</h1>
          <p className="tabular mt-1 text-[13px] text-muted-foreground">{q.data ? `${rows.length} clients` : "\u00a0"}</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Search name, email or phone" aria-label="Search clients" className="h-9 pl-9" />
        </div>
      </header>

      <div role="radiogroup" aria-label="Filter clients" className="-mx-1 mb-4 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
        {chips.map(([k, label]) => (
          <Button key={k} size="sm" role="radio" aria-checked={filter === k} variant={filter === k ? "dark" : "secondary"} onClick={() => setFilter(k)} className="h-10 shrink-0 rounded-full px-3.5 sm:h-8">
            {label}<span className={`tabular text-[11px] ${filter === k ? "text-white/70" : "text-muted-foreground"}`}>{counts[k]}</span>
          </Button>
        ))}
      </div>

      {q.isLoading && <LoadingRows n={6} />}
      {q.isError && <ErrorNote onRetry={() => q.refetch()} />}
      {q.data && !list.length && (
        <Empty title={t ? `No one matches "${term}".` : "No clients here."}>{t ? "Try a different name, email or phone." : "Try another filter."}</Empty>
      )}
      {!!list.length && (
        <div className="overflow-hidden rounded-2xl border border-line-1">
          <div className="hidden grid-cols-[minmax(0,1.6fr)_140px_150px_120px_72px] items-center gap-3 border-b border-line-1 bg-surface-2 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.04em] text-muted-foreground md:grid">
            <span>Client</span><span>Next appointment</span><span>Status</span><span>Last visit</span><span />
          </div>
          <ul>
            {list.map((c, i) => (
              <li key={c.id} className="enter-item group relative border-b border-line-1 last:border-0" style={{ animationDelay: `${Math.min(i, 12) * 25}ms` }}>
                <Link to="/owner/clients/$id" params={{ id: c.id }} className="grid min-h-14 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-2 transition-colors duration-150 hover:bg-surface-2 md:grid-cols-[minmax(0,1.6fr)_140px_150px_120px_72px]">
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-fill-neutral text-xs font-medium text-deep-ink">{c.name.charAt(0)}</span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-deep-ink">{c.name}{!c.is_returning && <Tag tone="accent" className="ml-2 align-middle">New</Tag>}</span>
                      <span className="block truncate text-xs text-muted-foreground">{c.email}</span>
                    </span>
                  </span>
                  <span className="tabular hidden text-[13px] text-deep-ink md:block">{c.next ? d(c.next.start_at) : <span className="text-muted-foreground">None</span>}</span>
                  <span className="flex flex-wrap gap-1">
                    {c.next && typeof c.next.ready_score === "number" && (c.next.ready_score >= 100 ? <Tag tone="success">Ready</Tag> : <Tag tone="warning">{c.next.ready_score}% ready</Tag>)}
                    {c.unpaid && <Tag tone="danger">Unpaid</Tag>}
                    {!c.next && !c.unpaid && c.filed && <Tag tone="success">Filed</Tag>}
                  </span>
                  <span className="tabular hidden text-[13px] text-muted-foreground md:block">{c.last ? d(c.last.start_at) : "None"}</span>
                  <span className="hidden justify-end md:flex"><ChevronRight className="size-4 text-muted-foreground" /></span>
                </Link>
                <a href={`mailto:${c.email}`} aria-label={`Email ${c.name}`} title="Email"
                  className="absolute right-12 top-1/2 hidden size-8 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground transition-colors duration-150 hover:bg-tint-1 hover:text-deep-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:grid">
                  <Mail className="size-4" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
