import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Copy, FileText, Mail, MessageSquare, Phone } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { APPT_SELECT, MSG_LABEL, fmtStamp, type Appt } from "./lib";
import { ApptCard, DocViewer, ErrorNote, LoadingRows } from "./ui";

export function ClientContent({ id, appointmentId }: { id: string; appointmentId?: string | undefined }) {
  const [docs, setDocs] = useState(false);
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
  const current = appts.find(a => a.id === appointmentId) ?? appts.find(a => a.status === "booked" || a.status === "confirmed") ?? appts[0];
  const items = current?.checklist_items ?? [];
  const files = items.filter(i => i.file_path);
  const copy = async (text: string) => { try { await navigator.clipboard.writeText(text); toast.success("Copied."); } catch { toast.error("Couldn't copy."); } };
  return <div className="space-y-6 pb-8">
    <header className="border-b border-border pb-4">
      <p className="text-xs text-muted-foreground">{client.is_returning ? "Returning client" : "Client"}</p>
      <h2 className="mt-1 t-owner text-deep-ink">{client.name}</h2>
      <div className="mt-3 space-y-2 text-sm">
        <div className="flex min-w-0 items-center gap-2"><Mail className="size-4 shrink-0 text-muted-foreground" /><a className="min-w-0 truncate text-ink hover:underline" href={`mailto:${client.email}`}>{client.email}</a><Button size="icon" variant="ghost" aria-label="Copy email" title="Copy email" onClick={() => copy(client.email)}><Copy className="size-3.5" /></Button></div>
        {client.phone && <div className="flex items-center gap-2"><Phone className="size-4 text-muted-foreground" /><a className="text-ink hover:underline" href={`tel:${client.phone}`}>{client.phone}</a><Button size="icon" variant="ghost" aria-label="Copy phone" title="Copy phone" onClick={() => copy(client.phone ?? "")}><Copy className="size-3.5" /></Button></div>}
      </div>
    </header>
    {client.notes && <p className="rounded-lg bg-surface-2 p-4 text-sm text-deep-ink">{client.notes}</p>}
    <section><h3 className="mb-3 font-sans text-xl font-medium text-deep-ink">Appointments</h3>
      {current ? <ApptCard a={current} showDate embedded /> : <p className="text-sm text-muted-foreground">No appointments yet.</p>}
      {appts.length > 1 && <details className="mt-3 text-sm"><summary className="cursor-pointer text-ink">Earlier appointments ({appts.length - 1})</summary><div className="mt-2 divide-y divide-border">{appts.filter(a => a.id !== current?.id).map(a => <ApptCard key={a.id} a={a} showDate embedded />)}</div></details>}
    </section>
    <section><h3 className="mb-1 font-sans text-xl font-medium text-deep-ink">Documents</h3><p className="text-xs text-muted-foreground">{files.length} received, {items.filter(i => i.required && i.status === "missing").length} missing</p>
      <Button size="sm" variant="outline" className="mt-3" disabled={!files.length} onClick={() => setDocs(true)}><FileText />View files</Button>
      <DocViewer open={docs} onOpenChange={setDocs} title={client.name} items={items} />
    </section>
    <section><h3 className="mb-3 font-sans text-xl font-medium text-deep-ink">Messages</h3>
      {msgs.length ? <ol className="divide-y divide-border">{msgs.map(m => <li key={m.id} className="py-3"><p className="text-sm text-deep-ink">{m.subject ?? MSG_LABEL[m.type]}</p><p className="text-xs text-muted-foreground">{m.channel === "sms" && <MessageSquare className="mr-1 inline size-3" />}{fmtStamp(m.sent_at)}, {MSG_LABEL[m.type]}{m.delivery === "failed" ? ", Not delivered" : ""}</p></li>)}</ol> : <p className="text-sm text-muted-foreground">No messages yet.</p>}
    </section>
  </div>;
}
