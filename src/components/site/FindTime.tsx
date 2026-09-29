import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SERVICES } from "@/lib/services";
import { getAvailabilityWindow } from "@/lib/booking.functions";
import { supabase } from "@/integrations/supabase/client";
import { fmtDayChip, fmtTime } from "@/lib/intake";

export function FindTime() {
  const [service, setService] = useState("extension");
  const [date, setDate] = useState("");
  const [meeting, setMeeting] = useState<"in_person" | "video">("in_person");
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const windowFn = useServerFn(getAvailabilityWindow);
  const svc = useQuery({ queryKey: ["home-services"], queryFn: async () => { const { data, error } = await supabase.from("services").select("id,slug").eq("active", true); if (error) throw error; return data; } });
  const id = svc.data?.find(s => s.slug === service)?.id;
  const availability = useQuery({ queryKey: ["home-availability", id], enabled: !!id, queryFn: () => windowFn({ data: { serviceId: id as string, days: 21 } }), staleTime: 30000 });
  const days = availability.data?.days.filter(d => d.slots.length) ?? [];
  const chosenDate = days.some(d => d.date === date) ? date : days[0]?.date;
  const chosen = days.find(d => d.date === chosenDate);
  const first = chosen?.slots[0];
  const dayText = chosenDate ? (() => { const d = fmtDayChip(chosenDate); return `${d.dow}, ${d.month} ${d.day}`; })() : "First available";
  const go = () => { setOpen(false); navigate({ to: "/book", search: { service, date: chosenDate, slot: first, meeting, step: 2 } }); };
  const form = <div className="grid gap-5 md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end md:gap-0">
    <label className="block min-w-0 md:border-r md:border-border md:px-5"><span className="block text-[11px] font-bold uppercase text-muted-foreground">Service</span><select aria-label="Service" className="mt-1 w-full min-w-0 bg-transparent py-2 text-sm font-semibold text-deep-ink outline-none" value={service} onChange={e => { setService(e.target.value); setDate(""); }}>{SERVICES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
    <label className="block min-w-0 md:border-r md:border-border md:px-5"><span className="block text-[11px] font-bold uppercase text-muted-foreground">Day</span><select aria-label="Day" className="mt-1 w-full min-w-0 bg-transparent py-2 text-sm font-semibold text-deep-ink outline-none" value={chosenDate ?? ""} onChange={e => setDate(e.target.value)}>{!days.length && <option value="">{availability.isLoading || svc.isLoading ? "Finding times…" : "No openings yet"}</option>}{days.map(d => { const f = fmtDayChip(d.date); return <option key={d.date} value={d.date}>{f.dow}, {f.month} {f.day}</option>; })}</select></label>
    <label className="block min-w-0 md:px-5"><span className="block text-[11px] font-bold uppercase text-muted-foreground">Meeting type</span><select aria-label="Meeting type" className="mt-1 w-full bg-transparent py-2 text-sm font-semibold text-deep-ink outline-none" value={meeting} onChange={e => setMeeting(e.target.value as "in_person" | "video")}><option value="in_person">In person</option><option value="video">Video</option></select></label>
    <Button type="button" onClick={go} disabled={!first} aria-label="Book selected appointment" className="h-12 w-full rounded-full md:w-12 md:px-0"><ArrowRight className="size-5" /></Button>
  </div>;
  return <div className="relative">
    <div className="hidden rounded-full border border-border bg-background p-2 shadow-lift md:block">{form}</div>
    <Button variant="outline" className="flex h-auto w-full items-center justify-between rounded-full px-5 py-4 text-left shadow-lift md:hidden" onClick={() => setOpen(true)}><span className="flex min-w-0 items-center gap-3"><CalendarDays className="size-5 shrink-0"/><span className="min-w-0 truncate text-sm">{SERVICES.find(s => s.id === service)?.name} · {dayText}</span></span><ChevronDown className="size-4 shrink-0" /></Button>
    <p aria-live="polite" className="mt-4 text-sm text-muted-foreground">{availability.isLoading || svc.isLoading ? "Finding the next opening…" : availability.isError || availability.data?.error ? "Times aren’t available right now. Please try booking directly." : first ? `Next opening ${fmtDayChip(chosenDate ?? "").dow} ${fmtTime(first)} · ${days.reduce((n,d) => n + d.slots.length,0)} openings in the next three weeks` : "No open times right now. Check back soon or join the waitlist while booking."}</p>
    {open && <div className="fixed inset-0 z-[100] overflow-y-auto bg-background px-5 py-8 md:hidden" role="dialog" aria-modal="true" aria-label="Find a time"><div className="mx-auto max-w-sm"><div className="mb-8 flex items-center justify-between"><h2 className="font-serif text-3xl">Find a time</h2><Button size="icon" variant="ghost" aria-label="Close" onClick={() => setOpen(false)}><X /></Button></div><div className="space-y-7">{form}</div><p className="mt-8 text-sm text-muted-foreground">Booking is confirmed instantly. Documents come later.</p></div></div>}
  </div>;
}
