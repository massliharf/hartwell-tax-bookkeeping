import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CalendarDays, Check, ChevronLeft, ChevronRight, Loader2, MapPin, Video, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DocumentStack } from "@/components/brand/DocumentStack";
import { ReadyRing } from "@/components/brand/ReadyRing";
import { getAvailabilityWindow } from "@/lib/booking.functions";
import { fmtTime, previewChecklist } from "@/lib/intake";
import { supabase } from "@/integrations/supabase/client";
import type { Service } from "@/lib/services";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
type Day = { date: string; closed: boolean; slots: string[] };
const monthStart = (d: string) => new Date(`${d.slice(0, 7)}-01T12:00:00Z`);
function CalendarMonth({ date, days, selected, onSelect }: { date: Date; days: Day[]; selected: string; onSelect: (d: string) => void }) {
  const year = date.getUTCFullYear(), month = date.getUTCMonth();
  const first = new Date(Date.UTC(year, month, 1, 12));
  const cells = Array.from({ length: first.getUTCDay() + new Date(Date.UTC(year, month + 1, 0)).getUTCDate() }, (_, i) => i - first.getUTCDay() + 1);
  const daysByDate = new Map(days.map(d => [d.date, d]));
  return <div className="min-w-0"><h4 className="mb-4 text-center font-serif text-xl text-deep-ink">{new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(first)}</h4><div className="grid grid-cols-7 gap-1 text-center">{WEEKDAYS.map(w => <span key={w} className="pb-2 text-[11px] text-muted-foreground">{w}</span>)}{cells.map((n,i) => {
    if (n < 1) return <span key={`empty-${i}`} />;
    const value = `${year}-${String(month+1).padStart(2,"0")}-${String(n).padStart(2,"0")}`;
    const entry = daysByDate.get(value), available = !!entry?.slots.length;
    return <Button key={value} type="button" variant="ghost" size="icon" onClick={() => onSelect(value)} disabled={!entry || entry.closed} aria-label={`${value}${available ? `, ${entry?.slots.length} openings` : ", fully booked"}`} aria-pressed={selected === value} className={`mx-auto size-9 rounded-full p-0 text-xs tabular ${selected === value ? "bg-primary text-primary-foreground hover:bg-primary" : available ? "font-bold text-deep-ink hover:bg-sage" : "text-muted-foreground line-through"}`}>{n}</Button>;
  })}</div></div>;
}
export function ServiceBookingCard({ service }: { service: Service }) {
  const fetchWindow = useServerFn(getAvailabilityWindow);
  const navigate = useNavigate();
  const [selected, setSelected] = useState("");
  const [slot, setSlot] = useState("");
  const [meeting, setMeeting] = useState<"in_person" | "video">("in_person");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [monthOffset, setMonthOffset] = useState(0);
  const serviceQuery = useQuery({queryKey:["detail-service-id",service.id],queryFn:async()=>{const {data,error}=await supabase.from("services").select("id").eq("slug",service.id).eq("active",true).maybeSingle();if(error)throw error;return data?.id ?? null;}});
  const serviceId = serviceQuery.data;
  const availability = useQuery({queryKey:["detail-availability",serviceId],enabled:!!serviceId,queryFn:()=>fetchWindow({data:{serviceId:serviceId as string,days:62}}),staleTime:30000});
  const days = availability.data?.days ?? [];
  const firstOpen = days.find(d=>d.slots.length)?.date;
  const activeDate = selected || firstOpen || "";
  const activeDay = days.find(d=>d.date===activeDate);
  const activeSlot = activeDay?.slots.includes(slot) ? slot : "";
  const baseMonth = days[0] ? monthStart(days[0].date) : null;
  const months = baseMonth ? [0,1].map(i=>new Date(Date.UTC(baseMonth.getUTCFullYear(),baseMonth.getUTCMonth()+monthOffset+i,1,12))) : [];
  const docs = previewChecklist(service.id,{});
  const go = () => { if (!activeSlot) return; setSheetOpen(false); navigate({to:"/book",search:{service:service.id,date:activeDate,slot:activeSlot,meeting,step:2}}); };
  useEffect(()=>{ if (!sheetOpen) return; const prev=document.body.style.overflow;document.body.style.overflow="hidden";return()=>{document.body.style.overflow=prev;}; },[sheetOpen]);
  const picker = <div className="space-y-6">
    <div className="flex items-center justify-between border-b border-border pb-4"><div><p className="text-xs text-muted-foreground">{service.from ? "From" : "Price"}</p><p className="tabular font-serif text-3xl text-deep-ink">${service.price}</p></div><span className="text-sm text-muted-foreground">{service.minutes} minutes</span></div>
    <div><div className="mb-4 flex items-center justify-between"><h3 className="font-serif text-2xl text-deep-ink">Choose a day</h3><div className="flex items-center gap-1"><Button variant="ghost" size="icon" className="size-8" aria-label="Previous months" disabled={monthOffset===0} onClick={()=>setMonthOffset(v=>Math.max(0,v-1))}><ChevronLeft/></Button><Button variant="ghost" size="icon" className="size-8" aria-label="Next months" disabled={!baseMonth || monthOffset>=1} onClick={()=>setMonthOffset(v=>Math.min(1,v+1))}><ChevronRight/></Button></div></div>
      {(serviceQuery.isLoading || availability.isLoading) && <div className="grid h-64 place-items-center text-muted-foreground" role="status"><Loader2 className="size-6 animate-spin"/><span className="sr-only">Loading available dates</span></div>}
      {(serviceQuery.isError || availability.isError || availability.data?.error || serviceId===null) && <div role="alert" className="rounded-[14px] bg-sheet p-4 text-sm text-muted-foreground">Times aren’t available right now. <Button variant="link" className="h-auto p-0" onClick={()=>{serviceQuery.refetch();availability.refetch();}}>Try again</Button></div>}
      {months.length>0 && !availability.isError && <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">{months.map(m=><CalendarMonth key={m.toISOString()} date={m} days={days} selected={activeDate} onSelect={d=>{setSelected(d);setSlot("");}}/>)}</div>}
    </div>
    <div><p className="mb-3 text-sm font-semibold text-deep-ink">{activeDate ? `Available times · ${new Intl.DateTimeFormat("en-US",{timeZone:"UTC",weekday:"short",month:"short",day:"numeric"}).format(new Date(`${activeDate}T12:00:00Z`))}` : "Available times"}</p>{activeDay?.slots.length ? <div className="grid grid-cols-3 gap-2">{activeDay.slots.map(time=><Button key={time} type="button" variant={activeSlot===time ? "default":"outline"} aria-pressed={activeSlot===time} className="h-10 px-1 text-xs tabular" onClick={()=>setSlot(time)}>{fmtTime(time)}</Button>)}</div> : <p className="text-sm text-muted-foreground">{activeDay ? "This day is full. Choose another date." : "No open times in this window."}</p>}</div>
    <fieldset><legend className="mb-3 text-sm font-semibold text-deep-ink">Meeting type</legend><div className="grid grid-cols-2 gap-2">{([["in_person","In person",MapPin],["video","Video",Video]] as const).map(([value,label,Icon])=><Button key={value} type="button" variant={meeting===value ? "default":"outline"} aria-pressed={meeting===value} onClick={()=>setMeeting(value)}><Icon className="size-4"/>{label}</Button>)}</div></fieldset>
    <Button className="w-full" disabled={!activeSlot} onClick={go}>Book this time <Check className="size-4"/></Button><p className="text-center text-xs text-muted-foreground">Confirmed instantly · No payment until you file</p>
    <div className="border-t border-border pt-5"><div className="flex items-center gap-4"><ReadyRing value={0} size={70} stroke={5}/><div><p className="font-serif text-xl text-deep-ink">Your checklist</p><p className="text-xs text-muted-foreground">{docs.length} typical documents · personalized after booking</p></div></div><div className="mt-4"><DocumentStack docs={docs.map(d=>({...d,received:false}))}/></div></div>
  </div>;
  return <><aside className="hidden self-start lg:sticky lg:top-24 lg:block"><div className="rounded-[14px] border border-border bg-background p-6 shadow-lift">{picker}</div></aside><div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-4 border-t border-border bg-background px-5 py-3 shadow-lift lg:hidden"><div><p className="text-xs text-muted-foreground">{service.from ? "From" : "Price"}</p><p className="tabular font-serif text-2xl text-deep-ink">${service.price}</p></div><Button onClick={()=>setSheetOpen(true)}><CalendarDays/>Choose a time</Button></div>{sheetOpen && <div className="fixed inset-0 z-[100] overflow-y-auto bg-background px-5 pb-16 pt-6 lg:hidden" role="dialog" aria-modal="true" aria-label="Choose a time"><div className="mx-auto max-w-lg"><div className="mb-7 flex items-center justify-between"><div><p className="text-xs uppercase text-ink">{service.name}</p><h2 className="font-serif text-3xl text-deep-ink">Find your time</h2></div><Button variant="ghost" size="icon" aria-label="Close" onClick={()=>setSheetOpen(false)}><X/></Button></div>{picker}</div></div>}</>;
}
