import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Copy, Mail, MapPin, MessageSquare, Phone, Video } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ReadyRing } from "@/components/brand/ReadyRing";
import { APPT_SELECT, MSG_LABEL, fmtDay, fmtLong, fmtStamp, fmtTime, type Appt } from "./lib";
import { ApptActions, DocViewer, ErrorNote, LoadingRows, StatusPill } from "./ui";
import { cn } from "@/lib/utils";

function Label({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-2 text-[13px] font-medium text-muted-foreground">{children}</h3>;
}

/** Everything about one client in a single scroll: contact, the current appointment with its checklist and actions, history and messages. */
export function ClientContent({ id, appointmentId }: { id: string; appointmentId?: string | undefined }) {
  const [viewer, setViewer] = useState<{ open: boolean; startId?: string | undefined }>({ open: false });
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
  const { client, appts, msgs } = q.data;
  const current = appts.find((a) => a.id === appointmentId) ?? appts.find((a) => a.status === "booked" || a.status === "confirmed") ?? appts[0];
  const items = [...(current?.checklist_items ?? [])].sort((x, y) => x.sort_order - y.sort_order);
  const earlier = appts.filter((a) => a.id !== current?.id);
  const copy = async (text: string) => { try { await navigator.clipboard.writeText(text); toast.success("Copied."); } catch { toast.error("Couldn't copy."); } };

  return (
    <div className="space-y-7 pb-8">
      <header>
        <div className="flex items-center gap-2">
          <h2 className="t-owner text-deep-ink">{client.name}</h2>
          {client.is_returning && <span className="rounded border border-border bg-fill-subtle px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">Returning</span>}
        </div>
        <div className="mt-3 divide-y divide-border rounded-xl border border-border text-sm">
          <div className="flex h-10 items-center gap-2.5 px-3"><Mail className="size-4 shrink-0 text-muted-foreground" /><a className="min-w-0 flex-1 truncate text-deep-ink hover:underline" href={`mailto:${client.email}`}>{client.email}</a><Button size="icon" variant="ghost" aria-label="Copy email" onClick={() => copy(client.email)}><Copy className="size-3.5" /></Button></div>
          {client.phone && <div className="flex h-10 items-center gap-2.5 px-3"><Phone className="size-4 shrink-0 text-muted-foreground" /><a className="tabular flex-1 text-deep-ink hover:underline" href={`tel:${client.phone}`}>{client.phone}</a><Button size="icon" variant="ghost" aria-label="Copy phone" onClick={() => copy(client.phone ?? "")}><Copy className="size-3.5" /></Button></div>}
        </div>
        {client.notes && <p className="mt-3 rounded-xl bg-surface-2 p-3 text-sm text-deep-ink">{client.notes}</p>}
      </header>

      {current ? (
        <section>
          <Label>{current.status === "booked" || current.status === "confirmed" ? "Upcoming appointment" : "Latest appointment"}</Label>
          <div className="rounded-2xl border border-border">
            <div className="flex items-start gap-4 p-4">
              <ReadyRing value={current.ready_score} size={56} stroke={5} />
              <div className="min-w-0 flex-1">
                <p className="tabular text-sm font-medium text-deep-ink">{fmtLong(current.start_at)}, {fmtTime(current.start_at)}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{current.services?.name}</p>
                <p className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                  {current.meeting_type === "video" ? <Video className="size-3.5" /> : <MapPin className="size-3.5" />}{current.meeting_type === "video" ? "Video" : "In person"}
                  <StatusPill status={current.status} />
                </p>
              </div>
            </div>
            <ul className="divide-y divide-border border-t border-border">
              {items.map((i) => (
                <li key={i.id} className="flex h-10 items-center gap-2.5 px-4 text-sm">
                  {i.status === "uploaded"
                    ? <span className="grid size-4 place-items-center rounded-full bg-success text-white"><Check className="size-2.5" strokeWidth={3} /></span>
                    : <span className={cn("size-4 rounded-full border", i.status === "not_applicable" ? "border-border bg-fill-subtle" : "border-warning/60")} />}
                  <span className={cn("min-w-0 flex-1 truncate", i.status === "uploaded" ? "text-deep-ink" : "text-muted-foreground")}>{i.document_name}</span>
                  {i.status === "uploaded"
                    ? <Button size="sm" variant="ghost" onClick={() => setViewer({ open: true, startId: i.id })}>View</Button>
                    : <span className={cn("text-xs", i.status === "not_applicable" ? "text-muted-foreground" : "text-warning")}>{i.status === "not_applicable" ? "Doesn't apply" : "Missing"}</span>}
                </li>
              ))}
            </ul>
            <div className="border-t border-border p-3"><ApptActions a={current} variant="buttons" /></div>
          </div>
          <DocViewer open={viewer.open} startId={viewer.startId} onOpenChange={(o) => setViewer((v) => ({ ...v, open: o }))} title={client.name} items={items} />
        </section>
      ) : <p className="text-sm text-muted-foreground">No appointments yet.</p>}

      {earlier.length > 0 && (
        <section>
          <Label>Other appointments</Label>
          <ul className="divide-y divide-border rounded-2xl border border-border">
            {earlier.map((a) => (
              <li key={a.id} className="flex h-11 items-center gap-3 px-4 text-sm">
                <span className="tabular w-24 shrink-0 text-deep-ink">{fmtDay(a.start_at)}</span>
                <span className="min-w-0 flex-1 truncate text-muted-foreground">{a.services?.name}</span>
                <StatusPill status={a.status} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <Label>Messages</Label>
        {msgs.length ? (
          <ol className="divide-y divide-border rounded-2xl border border-border">
            {msgs.map((m) => (
              <li key={m.id} className="flex items-start gap-2.5 px-4 py-3">
                {m.channel === "sms" ? <MessageSquare className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" /> : <Mail className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-deep-ink">{m.subject ?? MSG_LABEL[m.type]}</span>
                  <span className="block text-xs text-muted-foreground">{fmtStamp(m.sent_at)}, {MSG_LABEL[m.type] ?? m.type}{m.delivery === "failed" && <span className="text-destructive">, not delivered</span>}</span>
                </span>
              </li>
            ))}
          </ol>
        ) : <p className="text-sm text-muted-foreground">No messages yet.</p>}
      </section>
    </div>
  );
}
