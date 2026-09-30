import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useOwnerCtx } from "./ctx";
import { addDays, et, etToIso, fmtLong, fmtTime } from "./lib";
import { useApptPanel } from "./drawer-context";

const LABELS = ["Vacation", "Doctor", "Lunch"];
const toMins = (t: string) => { const [h, m] = t.split(":").map(Number); return (h ?? 0) * 60 + (m ?? 0); };

export function TimeOff() {
  const now = useOwnerCtx().data?.now ?? new Date().toISOString();
  const qc = useQueryClient();
  const openAppt = useApptPanel();
  const [date, setDate] = useState(() => et(now).ymd);
  const [allDay, setAllDay] = useState(true);
  const [from, setFrom] = useState("12:00");
  const [to, setTo] = useState("13:00");
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);

  const range = date ? (allDay ? { s: etToIso(date, 0), e: etToIso(addDays(date, 1), 0) } : { s: etToIso(date, toMins(from)), e: etToIso(date, toMins(to)) }) : null;
  const valid = !!range && new Date(range.e) > new Date(range.s);

  const list = useQuery({ queryKey: ["owner", "time-off", "list"], queryFn: async () => { const { data, error } = await supabase.from("time_off").select("id, starts_at, ends_at, all_day, label").gt("ends_at", now).order("starts_at"); if (error) throw error; return data ?? []; } });
  const clash = useQuery({
    queryKey: ["owner", "time-off", "clash", range?.s, range?.e], enabled: valid,
    queryFn: async () => { const { data, error } = await supabase.from("appointments").select("id, start_at, clients(name), services(name)").in("status", ["booked", "confirmed"]).lt("start_at", range!.e).gt("end_at", range!.s).order("start_at"); if (error) throw error; return data ?? []; },
  });

  const add = async () => {
    if (!range || !valid) return;
    setSaving(true);
    const { error } = await supabase.from("time_off").insert({ starts_at: range.s, ends_at: range.e, all_day: allDay, label: label.trim() || null });
    setSaving(false);
    if (error) { toast.error("Couldn't save. Try again."); return; }
    toast.success("Time off added. Those times are no longer bookable.");
    setLabel("");
    void qc.invalidateQueries({ queryKey: ["owner"] });
    void qc.invalidateQueries({ queryKey: ["availability"] });
  };
  const remove = async (id: string) => {
    const { error } = await supabase.from("time_off").delete().eq("id", id);
    if (error) { toast.error("Couldn't remove it. Try again."); return; }
    toast.success("Removed. Those times are bookable again.");
    void qc.invalidateQueries({ queryKey: ["owner"] });
    void qc.invalidateQueries({ queryKey: ["availability"] });
  };

  return (
    <div className="mt-6 border-t border-border pt-5">
      <h3 className="text-sm font-medium text-deep-ink">Time off</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">Blocked times disappear from online booking, rescheduling and New appointment.</p>

      <div className="mt-4 space-y-3 rounded-xl border border-border bg-paper p-3">
        <div className="flex flex-wrap items-center gap-3">
          <Input type="date" aria-label="Date" value={date} min={et(now).ymd} onChange={(e) => setDate(e.target.value)} className="w-40 bg-sheet" />
          <label className="flex items-center gap-2 text-sm text-deep-ink"><Switch checked={allDay} onCheckedChange={setAllDay} aria-label="All day" />All day</label>
          {!allDay && <span className="flex items-center gap-2">
            <Input type="time" step={900} aria-label="From" value={from} onChange={(e) => setFrom(e.target.value)} className="w-28 bg-sheet" />
            <span className="text-muted-foreground">–</span>
            <Input type="time" step={900} aria-label="To" value={to} onChange={(e) => setTo(e.target.value)} className="w-28 bg-sheet" />
          </span>}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {LABELS.map((l) => <Button key={l} type="button" size="sm" variant={label === l ? "dark" : "secondary"} aria-pressed={label === l} onClick={() => setLabel(label === l ? "" : l)}>{l}</Button>)}
          <Input aria-label="Label (optional)" placeholder="Label (optional)" value={label} maxLength={60} onChange={(e) => setLabel(e.target.value)} className="h-8 w-44 bg-sheet" />
        </div>
        {!valid && !allDay && <p className="text-xs text-destructive">The end time must be after the start time.</p>}
        {valid && (clash.data?.length ?? 0) > 0 && (
          <div role="alert" className="rounded-lg border border-warning/25 bg-warning/10 p-3 text-xs text-warning">
            <p className="flex items-center gap-1.5 font-medium"><AlertTriangle className="size-3.5" />This overlaps {clash.data!.length} booked appointment{clash.data!.length === 1 ? "" : "s"}. They stay booked; move or cancel them yourself.</p>
            <ul className="mt-2 space-y-1">{clash.data!.map((a) => (
              <li key={a.id}><button type="button" className="text-left text-ink underline underline-offset-2" onClick={() => openAppt({ appointmentId: a.id })}>
                {(a.clients as { name: string } | null)?.name ?? "Client"}, {fmtTime(a.start_at)}, {(a.services as { name: string } | null)?.name}
              </button></li>))}</ul>
          </div>
        )}
        <Button size="sm" disabled={!valid || saving} onClick={add}>{saving ? "Saving…" : "Add time off"}</Button>
      </div>

      <div className="mt-3">
        {list.isLoading ? <Skeleton className="h-12 rounded-xl" /> : list.isError ? <p className="text-xs text-destructive">Couldn't load time off. <button className="underline" onClick={() => list.refetch()}>Try again</button></p>
          : (list.data ?? []).length === 0 ? <p className="text-xs text-muted-foreground">No time off planned.</p>
          : <ul className="divide-y divide-border rounded-xl border border-border">{list.data!.map((o) => (
            <li key={o.id} className="flex items-center gap-3 px-3 py-2">
              <span className="min-w-0 flex-1 text-sm text-deep-ink">{fmtLong(o.starts_at)}<span className="block text-xs text-muted-foreground">{o.all_day ? "All day" : `${fmtTime(o.starts_at)} to ${fmtTime(o.ends_at)}`}{o.label ? `, ${o.label}` : ""}</span></span>
              <Button size="icon" variant="ghost" aria-label="Remove time off" onClick={() => remove(o.id)}><Trash2 /></Button>
            </li>))}</ul>}
      </div>
    </div>
  );
}
