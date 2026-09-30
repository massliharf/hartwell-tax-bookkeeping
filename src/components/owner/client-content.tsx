import { useQuery } from "@tanstack/react-query";
import { Copy, Mail, MessageSquare, Phone } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { APPT_SELECT, MSG_LABEL, fmtStamp, type Appt } from "./lib";
import { ApptList, ErrorNote, LoadingRows, PageHead } from "./ui";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section><h2 className="mb-2 text-sm font-medium text-deep-ink">{title}</h2>{children}</section>;
}

/** A person: contact details, their appointments (same rows as everywhere), and messages sent to them. */
export function ClientProfile({ id }: { id: string }) {
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
  const nowIso = new Date().toISOString();
  const appts = [...q.data.appts.filter((a) => a.start_at >= nowIso).reverse(), ...q.data.appts.filter((a) => a.start_at < nowIso)];
  const copy = async (text: string) => { try { await navigator.clipboard.writeText(text); toast.success("Copied."); } catch { toast.error("Couldn't copy."); } };

  return (
    <div className="space-y-8">
      <PageHead title={client.name} meta={client.is_returning ? "Returning client" : "Client"} />
      <Section title="Contact">
        <div className="divide-y divide-border rounded-2xl border border-border text-sm">
          <div className="flex h-12 items-center gap-3 px-4"><Mail className="size-4 shrink-0 text-muted-foreground" /><a className="min-w-0 flex-1 truncate text-deep-ink hover:underline" href={`mailto:${client.email}`}>{client.email}</a><Button size="icon" variant="ghost" aria-label="Copy email" onClick={() => copy(client.email)}><Copy className="size-3.5" /></Button></div>
          {client.phone && <div className="flex h-12 items-center gap-3 px-4"><Phone className="size-4 shrink-0 text-muted-foreground" /><a className="tabular flex-1 text-deep-ink hover:underline" href={`tel:${client.phone}`}>{client.phone}</a><Button size="icon" variant="ghost" aria-label="Copy phone" onClick={() => copy(client.phone ?? "")}><Copy className="size-3.5" /></Button></div>}
          {client.notes && <p className="px-4 py-3 text-deep-ink">{client.notes}</p>}
        </div>
      </Section>
      <Section title={`Appointments (${appts.length})`}>
        {appts.length ? <ApptList appts={appts} showDate showClient={false} /> : <p className="text-sm text-muted-foreground">No appointments yet.</p>}
      </Section>
      <Section title={`Messages (${msgs.length})`}>
        {msgs.length ? (
          <ol className="divide-y divide-border rounded-2xl border border-border">
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
