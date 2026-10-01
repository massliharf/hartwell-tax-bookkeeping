import { useQuery } from "@tanstack/react-query";
import { Mail, MessageSquare, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { APPT_SELECT, MSG_LABEL, fmtDay, fmtStamp, fmtTime, money, type Appt } from "./lib";
import { Tag } from "@/components/ui/tag";
import { NowBanner } from "./now";
import { useApptPanel } from "./drawer-context";
import { useOwnerCtx } from "./ctx";
import { ApptList, ErrorNote, LoadingRows } from "./ui";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section><h2 className="mb-3 t-sub">{title}</h2>{children}</section>;
}

/** A person: contact details, their appointments (same rows as everywhere), and messages sent to them. */
export function ClientProfile({ id }: { id: string }) {
  const ownerNow = useOwnerCtx().data?.now;
  const openAppt = useApptPanel();
  const q = useQuery({
    queryKey: ["owner", "client", id],
    queryFn: async () => {
      const [c, a, m] = await Promise.all([
        supabase.from("clients").select("id, name, email, phone, is_returning, notes, created_at").eq("id", id).maybeSingle(),
        supabase.from("appointments").select(APPT_SELECT).eq("client_id", id).order("start_at", { ascending: false }),
        supabase.from("messages").select("id, type, channel, subject, sent_at, minutes_saved, delivery").eq("client_id", id).order("sent_at", { ascending: false }),
      ]);
      if (c.error ?? a.error ?? m.error) throw c.error ?? a.error ?? m.error;
      return { client: c.data, appts: (a.data ?? []) as unknown as Appt[], msgs: m.data ?? [] };
    },
  });
  if (q.isLoading) return <LoadingRows />;
  if (q.isError) return <ErrorNote onRetry={() => q.refetch()} />;
  if (!q.data?.client) return <p className="text-sm text-muted-foreground">This client couldn't be found.</p>;
  const { client, msgs } = q.data;
  const nowIso = ownerNow ?? new Date().toISOString();
  // The appointment that is "live" for this client: the next upcoming one, else the latest one still in progress.
  const active = [...q.data.appts].filter((a) => a.status !== "cancelled" && !a.filed_at).sort((x, y) => x.start_at.localeCompare(y.start_at)).find((a) => a.start_at >= nowIso) ?? q.data.appts.find((a) => a.status !== "cancelled" && !a.filed_at);
  const appts = [...q.data.appts.filter((a) => a.start_at >= nowIso).reverse(), ...q.data.appts.filter((a) => a.start_at < nowIso)];

  return (
    <div className="space-y-8">
      {(() => {
        const next = q.data.appts.filter((a) => a.start_at >= nowIso && (a.status === "booked" || a.status === "confirmed")).sort((x, y) => x.start_at.localeCompare(y.start_at))[0];
        const owed = q.data.appts.filter((a) => a.status === "completed" && a.fee_cents != null && !a.paid_at).reduce((n, a) => n + (a.fee_cents ?? 0), 0);
        const filed = q.data.appts.filter((a) => a.filed_at).length;
        const stats: [string, string, "neutral" | "warning" | "success"][] = [
          ["Next appointment", next ? `${fmtDay(next.start_at)}, ${fmtTime(next.start_at)}` : "None booked", "neutral"],
          ["Documents", next ? (next.ready_score >= 100 ? "All in" : `${next.ready_score}% in`) : "Nothing due", next && next.ready_score < 100 ? "warning" : "neutral"],
          ["Balance", owed ? money(owed) + " unpaid" : "Nothing owed", owed ? "warning" : "neutral"],
          ["Returns filed", String(filed), filed ? "success" : "neutral"],
        ];
        return (
          <header>
            <div className="flex flex-wrap items-center gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-fill-neutral text-lg font-medium text-deep-ink">{client.name.charAt(0)}</span>
              <div className="min-w-0 flex-1">
                <h1 className="t-owner text-deep-ink">{client.name}</h1>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-muted-foreground"><span className="break-all">{client.email}</span>{client.phone && <span className="tabular">{client.phone}</span>}{client.is_returning ? <Tag>Returning</Tag> : <Tag tone="accent">New this season</Tag>}</p>
              </div>
              <div className="flex w-full gap-2 sm:w-auto">
                <Button asChild size="sm" variant="secondary"><a href={`mailto:${client.email}`}><Mail />Email</a></Button>
                {client.phone && <Button asChild size="sm" variant="secondary"><a href={`tel:${client.phone}`}><Phone />Call</a></Button>}
              </div>
            </div>
            <dl className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {stats.map(([k, v, tone]) => (
                 <div key={k} className="rounded-2xl border border-border bg-sheet px-3.5 py-3">
                  <dt className="text-xs text-muted-foreground">{k}</dt>
                  <dd className={`mt-1 text-sm font-medium ${tone === "warning" ? "text-alert-warning-fg" : tone === "success" ? "text-alert-success-fg" : "text-deep-ink"}`}>{v}</dd>
                </div>
              ))}
            </dl>
          </header>
        );
      })()}
      {active && (
        <Section title="Where things stand">
          <button type="button" onClick={() => openAppt({ appointmentId: active.id })} className="block w-full text-left">
            <NowBanner a={active} nowIso={nowIso} />
          </button>
        </Section>
      )}
       {client.notes && <Section title="Notes"><p className="rounded-2xl border border-border bg-sheet px-4 py-3 text-sm text-deep-ink">{client.notes}</p></Section>}
      <Section title={`Appointments (${appts.length})`}>
        {appts.length ? <ApptList appts={appts} showDate showClient={false} /> : <p className="text-sm text-muted-foreground">No appointments yet.</p>}
      </Section>
      <Section title={`Messages (${msgs.length})`}>
        {msgs.length ? (
          <ol className="divide-y divide-line-1 overflow-hidden rounded-2xl border border-line-1">
            {msgs.map((m) => (
              <li key={m.id} className="flex min-h-14 items-center gap-3 px-4 py-2">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-fill-neutral text-deep-ink">{m.channel === "sms" ? <MessageSquare className="size-4" /> : <Mail className="size-4" />}</span>
                <span className="min-w-0 flex-1"><span className="block truncate text-sm text-deep-ink">{m.subject ?? MSG_LABEL[m.type]}</span><span className="block text-xs text-muted-foreground">{fmtStamp(m.sent_at)}, {MSG_LABEL[m.type] ?? m.type}{m.delivery === "failed" && <span className="text-destructive">, not delivered</span>}</span></span>
              </li>
            ))}
          </ol>
        ) : <p className="text-sm text-muted-foreground">No messages yet.</p>}
      </Section>
    </div>
  );
}
