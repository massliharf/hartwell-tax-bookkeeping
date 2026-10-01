import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Plus, Users, Video, X, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DialogDescription, DialogTitle } from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useDocked } from "./use-docked";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { Skeleton } from "@/components/ui/skeleton";
import { getAvailabilityWindow } from "@/lib/booking.functions";
import { ownerBookAppointment } from "@/lib/owner.functions";
import { fmtDateLong, fmtDayChip, fmtTime } from "@/lib/intake";
import { useApptPanel } from "./drawer-context";
import { cn } from "@/lib/utils";
import { ClientAvatar } from "./client-avatar";

type Client = { id: string; name: string; email: string; phone: string | null };

/** Opens the New appointment dialog from anywhere (Today tiles, palette). */
export const openNewAppointment = () => window.dispatchEvent(new Event("owner:new-appointment"));

export function NewAppointmentButton({ compact = false, block = false, listen = false, row = false }: { compact?: boolean; block?: boolean; listen?: boolean; row?: boolean }) {
  const [open, setOpen] = useState(false);
  const docked = useDocked();
  useEffect(() => {
    if (!listen) return;
    const on = () => setOpen(true);
    window.addEventListener("owner:new-appointment", on);
    return () => window.removeEventListener("owner:new-appointment", on);
  }, [listen]);
  return (
    <>
      {row
        ? <button type="button" onClick={() => setOpen(true)} title={compact ? "New appointment" : undefined}
            className={`flex h-9 w-full items-center gap-2.5 rounded-lg text-[13px] font-medium text-deep-ink transition-colors duration-150 hover:bg-tint-1 ${compact ? "justify-center px-0" : "px-1.5"}`}>
            <span className="grid size-6 shrink-0 place-items-center rounded-md bg-ink text-white"><Plus className="size-3.5" strokeWidth={2.5} /></span>{!compact && "New appointment"}
          </button>
        : compact
        ? <Button size="icon" aria-label="New appointment" title="New appointment" onClick={() => setOpen(true)} className="size-9 rounded-lg sm:size-9"><Plus /></Button>
        : <Button size={block ? "md" : "sm"} onClick={() => setOpen(true)} className={block ? "w-full justify-start gap-2.5 px-3 text-[13px]" : undefined}><Plus />New appointment</Button>}
      {/* Same surface as the appointment panel: a right-side panel on wide screens, a bottom sheet on phones. */}
      <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-overlay-light backdrop-blur-[2px]" />
          <DialogPrimitive.Content className={docked
            ? "panel-in fixed bottom-2 right-2 top-2 z-50 flex w-[480px] flex-col overflow-hidden rounded-2xl bg-sheet"
            : "sheet-up fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col overflow-hidden rounded-t-[20px] bg-sheet sm:mx-auto sm:w-[600px]"}>
            {!docked && <div className="flex justify-center pt-2.5" aria-hidden="true"><span className="h-1 w-10 rounded-full bg-line-2" /></div>}
            <DialogPrimitive.Close aria-label="Close" className="absolute right-4 top-4 z-10 grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-tint-1 hover:text-deep-ink"><X className="size-4" /></DialogPrimitive.Close>
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">{open && <NewAppointmentForm onDone={() => setOpen(false)} />}</div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
}

function NewAppointmentForm({ onDone }: { onDone: () => void }) {
  const qc = useQueryClient();
  const openAppt = useApptPanel();
  const book = useServerFn(ownerBookAppointment);
  const [term, setTerm] = useState("");
  const [mode, setMode] = useState<"find" | "new">("find");
  const [picked, setPicked] = useState<Client | null>(null);
  const [newClient, setNewClient] = useState({ name: "", email: "", phone: "" });
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [meeting, setMeeting] = useState<"in_person" | "video">("in_person");
  const [slot, setSlot] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const clients = useQuery({ queryKey: ["owner", "clients-lite"], queryFn: async () => { const { data, error } = await supabase.from("clients").select("id, name, email, phone").order("name"); if (error) throw error; return (data ?? []) as Client[]; } });
  const services = useQuery({ queryKey: ["owner", "services-active"], queryFn: async () => { const { data, error } = await supabase.from("services").select("id, name, duration_min").eq("active", true).order("sort_order"); if (error) throw error; return data ?? []; } });

  const matches = term.trim().length > 0 ? (clients.data ?? []).filter((c) => `${c.name} ${c.email} ${c.phone ?? ""}`.toLowerCase().includes(term.trim().toLowerCase())).slice(0, 5) : [];
  const who = picked ?? (mode === "new" && newClient.name.trim() && /\S+@\S+\.\S+/.test(newClient.email) ? { name: newClient.name.trim(), email: newClient.email.trim(), phone: newClient.phone.trim() } : null);
  const svc = services.data?.find((s) => s.id === serviceId);
  const canBook = !!who && !!serviceId && !!slot && !busy;

  const submit = async () => {
    if (!who || !serviceId || !slot) return;
    setBusy(true); setErr(null);
    try {
      const r = await book({ data: { serviceId, start: slot, name: who.name, email: who.email, phone: who.phone ?? "", meetingType: meeting } });
      if (!r.ok) { setErr(r.error); setSlot(null); void qc.invalidateQueries({ queryKey: ["availability", serviceId] }); return; }
      toast.success(`Booked. ${who.name.split(" ")[0]} has been emailed the confirmation and portal link.`);
      await qc.invalidateQueries({ queryKey: ["owner"] });
      onDone();
      openAppt({ appointmentId: r.appointmentId });
    } catch { setErr("Couldn't schedule it. Try again."); }
    finally { setBusy(false); }
  };

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-border px-5 pb-4 pr-14 pt-5 sm:px-6">
        <DialogTitle className="text-[18px] font-semibold leading-6 text-deep-ink">New appointment</DialogTitle>
        <DialogDescription className="mt-0.5 text-sm text-muted-foreground">They get the same confirmation and reminders as clients who schedule online.</DialogDescription>
      </header>

      <div className="space-y-6 px-6 py-5">
        <section>
          <h3 className="mb-3 flex items-center gap-2 t-sub"><span className="tabular grid size-5 place-items-center rounded-full bg-deep-ink text-[11px] font-semibold text-white">1</span>Client</h3>
          {!picked && <Segmented className="mb-3" label="Client" value={mode} onChange={(v) => setMode(v)} options={[{ value: "find", label: "Existing client" }, { value: "new", label: "New client" }]} />}
          {picked ? (
            <div className="flex items-center gap-3 rounded-xl border border-border px-3 py-2.5">
               <ClientAvatar name={picked.name} id={picked.id} />
              <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-deep-ink">{picked.name}</span><span className="block truncate text-xs text-muted-foreground">{picked.email}</span></span>
              <Button size="icon" variant="ghost" aria-label="Choose a different client" onClick={() => setPicked(null)}><X /></Button>
            </div>
          ) : (
            <>
              {mode === "find" && <><Input aria-label="Search existing clients" placeholder="Search by name, email or phone" value={term} onChange={(e) => setTerm(e.target.value)} />
              {matches.length > 0 && <ul className="mt-2 divide-y divide-border rounded-xl border border-border">{matches.map((c) => (
                <li key={c.id}><button type="button" onClick={() => { setPicked(c); setTerm(""); }} className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors duration-150 hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <span className="min-w-0 flex-1 truncate text-sm text-deep-ink">{c.name} <span className="text-xs text-muted-foreground">{c.email}</span></span>
                </button></li>))}</ul>}
              {term.trim() && !clients.isLoading && matches.length === 0 && <p className="mt-2 text-xs text-muted-foreground">No client matches. <button type="button" className="font-medium text-ink underline" onClick={() => { setMode("new"); setNewClient({ ...newClient, name: term.trim() }); }}>Add them as a new client</button></p>}
              </>}
              {mode === "new" && <div className="grid gap-2 sm:grid-cols-2">
                <Input aria-label="Full name" placeholder="Full name" value={newClient.name} onChange={(e) => setNewClient({ ...newClient, name: e.target.value })} className="sm:col-span-2" />
                <Input aria-label="Email" type="email" placeholder="Email" value={newClient.email} onChange={(e) => setNewClient({ ...newClient, email: e.target.value })} />
                <Input aria-label="Phone" type="tel" placeholder="Phone (optional)" value={newClient.phone} onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })} />
              </div>}
            </>
          )}
        </section>

        <section>
          <h3 className="mb-3 flex items-center gap-2 t-sub"><span className="tabular grid size-5 place-items-center rounded-full bg-deep-ink text-[11px] font-semibold text-white">2</span>Service and place</h3>
          {services.isLoading ? <Skeleton className="h-24 rounded-xl" /> : (
            <div className="grid gap-2 sm:grid-cols-2">{(services.data ?? []).map((s) => (
              <Button key={s.id} variant="secondary" aria-pressed={serviceId === s.id} onClick={() => { setServiceId(s.id); setSlot(null); }}
                className={cn("h-auto min-h-11 justify-between gap-3 whitespace-normal px-3 py-2.5 text-left", serviceId === s.id && "bg-deep-ink text-white hover:bg-deep-ink")}>
                <span className="text-sm">{s.name}</span><span className={cn("tabular text-xs", serviceId === s.id ? "text-primary-foreground/70" : "text-muted-foreground")}>{s.duration_min} min</span>
              </Button>))}</div>
          )}
          <Segmented className="mt-3" label="Meeting type" value={meeting} onChange={setMeeting} options={[{ value: "in_person", label: <><Users /> In person</> }, { value: "video", label: <><Video /> Video call</> }]} />
        </section>

        {serviceId && (
          <section>
            <h3 className="mb-3 flex items-center gap-2 t-sub"><span className="tabular grid size-5 place-items-center rounded-full bg-deep-ink text-[11px] font-semibold text-white">3</span>Time<span className="text-xs font-normal text-muted-foreground">All times Eastern</span></h3>
            <SlotPicker key={serviceId} serviceId={serviceId!} value={slot} onChange={setSlot} />
          </section>
        )}
        {err && <p role="alert" className="text-sm text-destructive">{err}</p>}
      </div>

      <footer className="sticky bottom-0 mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border bg-sheet px-5 py-4 sm:px-6">
        <span className="min-w-0 text-xs text-muted-foreground">{!who ? "Choose or add the client." : !serviceId ? "Pick a service." : !slot ? "Pick a time." : `${who.name}: ${svc?.name}, ${fmtDateLong(slot)} at ${fmtTime(slot)}`}</span>
        <div className="flex gap-2"><Button variant="secondary" onClick={onDone}>Cancel</Button><Button disabled={!canBook} onClick={submit}>{busy ? "Scheduling…" : "Schedule and send confirmation"}</Button></div>
      </footer>
    </div>
  );
}

/** Day chips + 30-minute times from the same availability the public booking page uses. Shared by New appointment and "Needs another meeting". */
export function SlotPicker({ serviceId, value, onChange }: { serviceId: string; value: string | null; onChange: (slot: string | null) => void }) {
  const fetchWindow = useServerFn(getAvailabilityWindow);
  const [date, setDate] = useState<string | null>(null);
  const avail = useQuery({ queryKey: ["availability", serviceId], staleTime: 15_000, queryFn: () => fetchWindow({ data: { serviceId, days: 21 } }) });
  const days = (avail.data?.days ?? []).map((d) => ({ ...d, slots: d.slots.filter((x) => new Date(x).getUTCMinutes() % 30 === 0) }));
  const selDate = date ?? days.find((d) => d.slots.length)?.date ?? null;
  const day = days.find((d) => d.date === selDate);
  const weeks = Math.max(1, Math.ceil(days.length / 7));
  const [week, setWeek] = useState(0);
  const shown = days.slice(week * 7, week * 7 + 7);
  const weekLabel = shown.length ? `${fmtDayChip(shown[0]!.date).month} ${fmtDayChip(shown[0]!.date).day} to ${fmtDayChip(shown.at(-1)!.date).month} ${fmtDayChip(shown.at(-1)!.date).day}` : "";
  if (avail.isLoading) return <div className="flex gap-1">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-[68px] w-[68px] rounded-lg" />)}</div>;
  if (avail.isError || avail.data?.error) return <p className="text-sm text-muted-foreground">Couldn't load times. <button className="font-medium text-ink underline" onClick={() => avail.refetch()}>Try again</button></p>;
  return (
    <>
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-deep-ink">{weekLabel}</p>
        <div className="flex gap-1">
          <Button variant="secondary" size="icon" aria-label="Previous week" disabled={week === 0} onClick={() => setWeek((w) => Math.max(0, w - 1))}><ChevronLeft /></Button>
          <Button variant="secondary" size="icon" aria-label="Next week" disabled={week >= weeks - 1} onClick={() => setWeek((w) => Math.min(weeks - 1, w + 1))}><ChevronRight /></Button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1" role="listbox" aria-label="Choose a day">
        {shown.map((d) => {
          const c = fmtDayChip(d.date); const active = d.date === selDate; const n = d.slots.length; const full = !d.closed && n === 0;
          return (
            <button key={d.date} type="button" role="option" aria-selected={active} disabled={d.closed || full} onClick={() => { setDate(d.date); onChange(null); }}
              className={cn("flex min-h-[64px] flex-col items-center justify-center gap-0.5 rounded-lg border px-0.5 transition-colors duration-150", active ? "border-deep-ink bg-deep-ink text-white" : d.closed || full ? "border-transparent text-muted-foreground/60" : "border-line-1 bg-sheet text-deep-ink hover:border-line-3")}>
              <span className={cn("text-[11px]", active ? "text-white/70" : "text-muted-foreground")}>{c.dow}</span>
              <span className="tabular text-base font-medium leading-tight">{c.day}</span>
              <span className={cn("text-[10px] font-medium", active ? "text-white/80" : full || d.closed ? "" : "text-success")}>{d.closed ? "Closed" : full ? "Full" : `${n} open`}</span>
            </button>
          );
        })}
      </div>
      {day && day.slots.length > 0 ? (
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">{day.slots.map((s) => (
          <Button key={s} variant={value === s ? "dark" : "secondary"} aria-pressed={value === s} onClick={() => onChange(s)} className="tabular h-10 text-sm">{fmtTime(s)}</Button>))}</div>
      ) : <p className="mt-3 text-sm text-muted-foreground">No open times in the next two weeks.</p>}
    </>
  );
}
