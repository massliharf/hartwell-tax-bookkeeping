import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, FileText, Mail, MessageSquare, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { APPT_SELECT, MSG_LABEL, fmtStamp, type Appt } from "@/components/owner/lib";
import { ApptCard, DocViewer, ErrorNote, LoadingRows, PageHead } from "@/components/owner/ui";

export const Route = createFileRoute("/_authenticated/owner/clients/$id")({ component: ClientDetail });

function ClientDetail() {
  const { id } = Route.useParams();
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
  if (!q.data?.client) return <p className="text-muted-foreground">This client couldn't be found. <Link to="/owner/clients" className="underline">Back to clients</Link></p>;
  const { client, appts, msgs } = q.data;
  const items = appts.flatMap((a) => a.checklist_items);
  const files = items.filter((i) => i.file_path);

  return (
    <>
      <Link to="/owner/clients" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-ink"><ArrowLeft className="h-4 w-4" />All clients</Link>
      <PageHead eyebrow={client.is_returning ? "Returning client" : "Client"} title={client.name}>
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
          <a href={`mailto:${client.email}`} className="inline-flex items-center gap-1.5 hover:text-ink"><Mail className="h-4 w-4" />{client.email}</a>
          {client.phone && <a href={`tel:${client.phone}`} className="inline-flex items-center gap-1.5 hover:text-ink"><Phone className="h-4 w-4" />{client.phone}</a>}
        </div>
      </PageHead>
      {client.notes && <p className="mb-8 rounded-2xl bg-sage/60 p-4 text-sm text-deep-ink">{client.notes}</p>}

      <div className="grid gap-10 lg:grid-cols-[1fr_300px]">
        <section>
          <h2 className="mb-4 font-serif text-2xl text-deep-ink">Appointments</h2>
          {appts.length ? <div className="space-y-6">{appts.map((a) => <ApptCard key={a.id} a={a} showDate />)}</div>
            : <p className="text-sm text-muted-foreground">No appointments yet.</p>}
        </section>
        <aside className="space-y-10">
          <section>
            <h2 className="mb-3 font-serif text-2xl text-deep-ink">Documents</h2>
            <p className="text-sm text-muted-foreground">{files.length} received · {items.filter((i) => i.required && i.status === "missing").length} missing</p>
            <Button size="sm" variant="outline" className="mt-3" disabled={!files.length} onClick={() => setDocs(true)}><FileText />View files</Button>
            <DocViewer open={docs} onOpenChange={setDocs} title={client.name} items={items} />
          </section>
          <section>
            <h2 className="mb-3 font-serif text-2xl text-deep-ink">Messages</h2>
            {msgs.length ? (
              <ol className="relative space-y-4 border-l border-border pl-5">
                {msgs.map((m) => (
                  <li key={m.id} className="relative">
                    <span className="absolute -left-[25px] top-1.5 h-2 w-2 rounded-full bg-ink/40" />
                    <p className="text-sm text-deep-ink">{m.subject ?? MSG_LABEL[m.type]}</p>
                    <p className="text-xs text-muted-foreground">
                      {m.channel === "sms" && <MessageSquare className="mr-1 inline h-3 w-3" />}{fmtStamp(m.sent_at)} · {MSG_LABEL[m.type]}{m.delivery === "failed" ? " · Not delivered" : ""}
                    </p>
                  </li>
                ))}
              </ol>
            ) : <p className="text-sm text-muted-foreground">No messages yet.</p>}
          </section>
        </aside>
      </div>
    </>
  );
}
