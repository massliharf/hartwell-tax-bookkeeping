import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Plus, Users, Video, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { Skeleton } from "@/components/ui/skeleton";
import { getAvailabilityWindow } from "@/lib/booking.functions";
import { ownerBookAppointment } from "@/lib/owner.functions";
import { fmtDateLong, fmtDayChip, fmtTime } from "@/lib/intake";
import { useApptPanel } from "./drawer-context";
import { cn } from "@/lib/utils";

type Client = { id: string; name: string; email: string; phone: string | null };

export function NewAppointmentButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" variant="accent" onClick={() => setOpen(true)}><Plus />New appointment</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="block max-h-[92dvh] max-w-[560px] overflow-y-auto p-0">
          {open && <NewAppointmentForm onDone={() => setOpen(false)} />}
        </DialogContent>
      </Dialog>
    </>
  );
}

function NewAppointmentForm({ onDone }: { onDone: () => void }) {
  const qc = useQueryClient();
  const openAppt = useApptPanel();
  const book = useServerFn(ownerBookAppointment);
  const fetchWindow = useServerFn(getAvailabilityWindow);
  const [term, setTerm] = useState("");
  const [picked, setPicked] = useState<Client | null>(null);
  const [newClient, setNewClient] = useState({ name: "", email: "", phone: "" });
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [meeting, setMeeting] = useState<"in_person" | "video">("in_person");
  const [date, setDate] = useState<string | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const clients = useQuery({ queryKey: ["owner", "clients-lite"], queryFn: async () => { const { data, error } = await supabase.from("clients").select("id, name, email, phone").order("name"); if (error) throw error; return (data ?? []) as Client[]; } });
  const services = useQuery({ queryKey: ["owner", "services-active"], queryFn: async () => { const { data, error } = await supabase.from("services").select("id, name, duration_min").eq("active", true).order("sort_order"); if (error) throw error; return data ?? []; } });
  const avail = useQuery({ queryKey: ["availability", serviceId], enabled: !!serviceId, staleTime: 15_000, queryFn: () => fetchWindow({ data: { serviceId: serviceId!, days: 14 } }) });
  const days = (avail.data?.days ?? []).map((d) => ({ ...d, slots: d.slots.filter((x) => new Date(x).getUTCMinutes() % 30 === 0) }));
  const selDate = date ?? days.find((d) => d.slots.length)?.date ?? null;
  const day = days.find((d) => d.date === selDate);

  const matches = term.trim().length > 0 ? (clients.data ?? []).filter((c) => `${c.name} ${c.email} ${c.phone ?? ""}`.toLowerCase().includes(term.trim().toLowerCase())).slice(0, 5) : [];
  const who = picked ?? (newClient.name.trim() && /\S+@\S+\.\S+/.test(newClient.email) ? { name: newClient.name.trim(), email: newClient.email.trim(), phone: newClient.phone.trim() } : null);
  const svc = services.data?.find((s) => s.id === serviceId);
  const canBook = !!who && !!serviceId && !!slot && !busy;

  const submit = async () => {
    if (!who || !serviceId || !slot) return;
    setBusy(true); setErr(null);
    try {
      const r = await book({ data: { serviceId, start: slot, name: who.name, email: who.email, phone: who.phone ?? "", meetingType: meeting } });
      if (!r.ok) { setErr(r.error); setSlot(null); void avail.refetch(); return; }
      toast.success(`Booked. ${who.name.split(" ")[0]} has been emailed the confirmation and portal link.`);
      await qc.invalidateQueries({ queryKey: ["owner"] });
      onDone();
      openAppt({ appointmentId: r.appointmentId });
    } catch { setErr("Couldn't book it. Try again."); }
    finally { setBusy(false); }
  };

  return (
    <div className="flex flex-col">
      <header className="border-b border-border px-6 pb-4 pr-14 pt-6">
        <DialogTitle className="t-owner text-deep-ink">New appointment</DialogTitle>
        <DialogDescription className="mt-1 text-xs text-muted-foreground">For a client who called. They get the same confirmation, checklist and reminders as an online booking.</DialogDescription>
      </header>

      <div className="space-y-6 px-6 py-5">
        <section>
          <h3 className="mb-2 text-sm font-medium text-deep-ink">Client</h3>
          {picked ? (
            <div className="flex items-center gap-3 rounded-xl border border-border px-3 py-2.5">
              <span className="grid size-8 place-items-center rounded-full bg-fill-neutral text-xs font-medium text-deep-ink">{picked.name.charAt(0)}</span>
              <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-deep-ink">{picked.name}</span><span className="block truncate text-xs text-muted-foreground">{picked.email}</span></span>
              <Button size="icon" variant="ghost" aria-label="Choose a different client" onClick={() => setPicked(null)}><X /></Button>
            </div>
          ) : (
            <>
              <Input aria-label="Search existing clients" placeholder="Search by name, email or phone" value={term} onChange={(e) => setTerm(e.target.value)} />
              {matches.length > 0 && <ul className="mt-2 divide-y divide-border rounded-xl border border-border">{matches.map((c) => (
                <li key={c.id}><button type="button" onClick={() => { setPicked(c); setTerm(""); }} className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors duration-150 hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <span className="min-w-0 flex-1 truncate text-sm text-deep-ink">{c.name} <span className="text-xs text-muted-foreground">{c.email}</span></span>
                </button></li>))}</ul>}
              {term.trim() && !clients.isLoading && matches.length === 0 && <p className="mt-2 text-xs text-muted-foreground">No client matches. Add them below.</p>}
              <p className="mb-2 mt-4 text-xs text-muted-foreground">Or a new client</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <Input aria-label="Full name" placeholder="Full name" value={newClient.name} onChange={(e) => setNewClient({ ...newClient, name: e.target.value })} className="sm:col-span-2" />
                <Input aria-label="Email" type="email" placeholder="Email" value={newClient.email} onChange={(e) => setNewClient({ ...newClient, email: e.target.value })} />
                <Input aria-label="Phone" type="tel" placeholder="Phone (optional)" value={newClient.phone} onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })} />
              </div>
            </>
          )}
        </section>

        <section>
          <h3 className="mb-2 text-sm font-medium text-deep-ink">Service</h3>
          {services.isLoading ? <Skeleton className="h-24 rounded-xl" /> : (
            <div className="grid gap-2 sm:grid-cols-2">{(services.data ?? []).map((s) => (
              <Button key={s.id} variant="secondary" aria-pressed={serviceId === s.id} onClick={() => { setServiceId(s.id); setDate(null); setSlot(null); }}
                className={cn("h-auto justify-between whitespace-normal px-3 py-2.5 text-left", serviceId === s.id && "bg-primary text-primary-foreground hover:bg-primary")}>
                <span className="text-sm">{s.name}</span><span className={cn("tabular text-xs", serviceId === s.id ? "text-primary-foreground/70" : "text-muted-foreground")}>{s.duration_min} min</span>
              </Button>))}</div>
          )}
        </section>

        <Segmented label="Meeting type" value={meeting} onChange={setMeeting} options={[{ value: "in_person", label: <><Users /> In person</> }, { value: "video", label: <><Video /> Video call</> }]} />

        {serviceId && (
          <section>
            <h3 className="mb-2 text-sm font-medium text-deep-ink">Time <span className="text-xs font-normal text-muted-foreground">All times Eastern</span></h3>
            {avail.isLoading ? <div className="flex gap-1">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-[68px] w-[68px] rounded-lg" />)}</div>
              : avail.isError || avail.data?.error ? <p className="text-sm text-muted-foreground">Couldn't load times. <button className="font-medium text-ink underline" onClick={() => avail.refetch()}>Try again</button></p>
              : <>
                <div className="flex gap-1 overflow-x-auto pb-2 [scrollbar-width:none]" role="listbox" aria-label="Choose a day">
                  {days.map((d) => {
                    const c = fmtDayChip(d.date); const active = d.date === selDate; const n = d.slots.length; const full = !d.closed && n === 0;
                    return (
                      <Button key={d.date} variant="secondary" role="option" aria-selected={active} disabled={d.closed || full} onClick={() => { setDate(d.date); setSlot(null); }}
                        className={cn("flex h-[68px] w-[68px] shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg border px-1", active ? "border-deep-ink bg-deep-ink text-primary-foreground hover:bg-deep-ink" : d.closed ? "border-transparent bg-transparent text-muted-foreground/50" : "border-border bg-sheet text-deep-ink hover:bg-surface-2")}>
                        <span className={cn("text-[11px]", active ? "text-primary-foreground/70" : "text-muted-foreground")}>{c.dow}</span>
                        <span className="tabular text-base font-medium leading-tight">{c.day}</span>
                        <span className={cn("text-[10px] font-medium", active ? "text-primary-foreground/80" : full || d.closed ? "text-muted-foreground" : "text-success")}>{d.closed ? "Closed" : full ? "Full" : `${n} open`}</span>
                      </Button>
                    );
                  })}
                </div>
                {day && day.slots.length > 0 ? (
                  <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">{day.slots.map((s) => (
                    <Button key={s} variant={slot === s ? "dark" : "secondary"} aria-pressed={slot === s} onClick={() => setSlot(s)} className="tabular h-10 text-sm">{fmtTime(s)}</Button>))}</div>
                ) : <p className="mt-3 text-sm text-muted-foreground">No open times in the next two weeks.</p>}
              </>}
          </section>
        )}
        {err && <p role="alert" className="text-sm text-destructive">{err}</p>}
      </div>

      <footer className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 rounded-b-2xl border-t border-border bg-sheet px-6 py-4">
        <span className="min-w-0 text-xs text-muted-foreground">{slot && svc ? `${svc.name}, ${fmtDateLong(slot)} at ${fmtTime(slot)}` : "Pick a client, service and time."}</span>
        <div className="flex gap-2"><Button variant="secondary" onClick={onDone}>Cancel</Button><Button disabled={!canBook} onClick={submit}>{busy ? "Booking…" : "Book and send confirmation"}</Button></div>
      </footer>
    </div>
  );
}
