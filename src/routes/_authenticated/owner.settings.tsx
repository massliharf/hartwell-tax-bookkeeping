import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ErrorNote, LoadingRows, PageHead } from "@/components/owner/ui";

export const Route = createFileRoute("/_authenticated/owner/settings")({ head: () => ({ meta: [{ title: "Settings — Patel Tax & Bookkeeping" }] }), component: SettingsPage });

const DAYS = [["mon", "Monday"], ["tue", "Tuesday"], ["wed", "Wednesday"], ["thu", "Thursday"], ["fri", "Friday"], ["sat", "Saturday"], ["sun", "Sunday"]] as const;
type Hours = Record<string, [string, string] | null>;
type Timings = { docs_reminder_days: number; readiness_check_hours: number; final_reminder_hours: number; abandoned_nudge_hours: number };
type Svc = { id: string; name: string; duration_min: number; price_from: number; is_from_price: boolean; active: boolean };

function SettingsPage() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["owner", "settings"],
    queryFn: async () => {
      const [s, v] = await Promise.all([
        supabase.from("settings").select("hours, buffer_min, reminder_timings").eq("id", 1).single(),
        supabase.from("services").select("id, name, duration_min, price_from, is_from_price, active").order("sort_order"),
      ]);
      if (s.error ?? v.error) throw s.error ?? v.error;
      return { s: s.data, v: (v.data ?? []) as Svc[] };
    },
  });
  const [hours, setHours] = useState<Hours>({});
  const [buffer, setBuffer] = useState(15);
  const [tm, setTm] = useState<Timings>({ docs_reminder_days: 7, readiness_check_hours: 48, final_reminder_hours: 24, abandoned_nudge_hours: 1 });
  const [svcs, setSvcs] = useState<Svc[]>([]);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (!q.data) return;
    setHours(q.data.s.hours as Hours);
    setBuffer(q.data.s.buffer_min);
    setTm((t) => ({ ...t, ...(q.data.s.reminder_timings as Partial<Timings>) }));
    setSvcs(q.data.v);
  }, [q.data]);

  const save = async (key: string, fn: () => Promise<{ error: unknown }[]>) => {
    setSaving(key);
    const res = await fn();
    setSaving(null);
    if (res.some((r) => r.error)) toast.error("Couldn't save. Try again.");
    else { toast.success("Saved."); qc.invalidateQueries({ queryKey: ["owner"] }); }
  };

  if (q.isLoading) return <LoadingRows />;
  if (q.isError) return <ErrorNote onRetry={() => q.refetch()} />;

  return (
    <>
      <PageHead eyebrow="Settings" title="How your practice runs" />
      <div className="space-y-8">
        <Card title="Office hours" note="Bookings only offer times inside these hours.">
          <ul className="divide-y divide-border">
            {DAYS.map(([k, label]) => {
              const h = hours[k];
              return (
                <li key={k} className="flex flex-wrap items-center gap-3 py-3">
                  <span className="w-28 text-sm text-deep-ink">{label}</span>
                  <Switch checked={!!h} onCheckedChange={(on) => setHours({ ...hours, [k]: on ? ["09:00", "17:00"] : null })} aria-label={`Open on ${label}`} />
                  {h ? (
                    <span className="flex items-center gap-2">
                      <Input type="time" step={900} value={h[0]} onChange={(e) => setHours({ ...hours, [k]: [e.target.value, h[1]] })} className="w-28 bg-paper" />
                      <span className="text-muted-foreground">–</span>
                      <Input type="time" step={900} value={h[1]} onChange={(e) => setHours({ ...hours, [k]: [h[0], e.target.value] })} className="w-28 bg-paper" />
                    </span>
                  ) : <span className="text-sm text-muted-foreground">Closed</span>}
                </li>
              );
            })}
          </ul>
          <label className="mt-4 flex items-center gap-3 text-sm text-deep-ink">
            Break between appointments
            <Input type="number" min={0} max={60} step={5} value={buffer} onChange={(e) => setBuffer(Number(e.target.value))} className="w-20 bg-paper" /> min
          </label>
          <Button className="mt-5" disabled={saving === "hours"} onClick={() => save("hours", async () => [await supabase.from("settings").update({ hours, buffer_min: buffer }).eq("id", 1)])}>Save hours</Button>
        </Card>

        <Card title="Services and prices" note="What clients can book, how long it takes, and the starting fee.">
          <div className="space-y-3">
            {svcs.map((s, i) => {
              const set = (p: Partial<Svc>) => setSvcs(svcs.map((x, j) => (j === i ? { ...x, ...p } : x)));
              return (
                <div key={s.id} className="grid grid-cols-2 items-center gap-3 rounded-xl border border-border bg-paper p-3 sm:grid-cols-[1fr_110px_110px_auto]">
                  <Input value={s.name} onChange={(e) => set({ name: e.target.value })} className="col-span-2 bg-sheet sm:col-span-1" aria-label="Service name" />
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground"><Input type="number" min={15} step={15} value={s.duration_min} onChange={(e) => set({ duration_min: Number(e.target.value) })} className="bg-sheet" aria-label="Minutes" />min</label>
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground">$<Input type="number" min={0} step={5} value={s.price_from} onChange={(e) => set({ price_from: Number(e.target.value) })} className="bg-sheet" aria-label="Price" /></label>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground"><Switch checked={s.active} onCheckedChange={(v) => set({ active: v })} />Bookable</label>
                </div>
              );
            })}
          </div>
          <Button className="mt-5" disabled={saving === "svc"} onClick={() => save("svc", () => Promise.all(svcs.map((s) => supabase.from("services").update({ name: s.name, duration_min: s.duration_min, price_from: s.price_from, active: s.active }).eq("id", s.id))))}>Save services</Button>
        </Card>

        <Card title="Reminder timings" note="When the automatic messages go out.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Num label="Document reminder" unit="days before" v={tm.docs_reminder_days} on={(n) => setTm({ ...tm, docs_reminder_days: n })} />
            <Num label="Readiness check" unit="hours before" v={tm.readiness_check_hours} on={(n) => setTm({ ...tm, readiness_check_hours: n })} />
            <Num label="Final reminder" unit="hours before" v={tm.final_reminder_hours} on={(n) => setTm({ ...tm, final_reminder_hours: n })} />
            <Num label="Unfinished booking nudge" unit="hours after" v={tm.abandoned_nudge_hours} on={(n) => setTm({ ...tm, abandoned_nudge_hours: n })} />
          </div>
          <Button className="mt-5" disabled={saving === "tm"} onClick={() => save("tm", async () => [await supabase.from("settings").update({ reminder_timings: tm }).eq("id", 1)])}>Save timings</Button>
        </Card>
      </div>
    </>
  );
}

function Card({ title, note, children }: { title: string; note: string; children: React.ReactNode }) {
  return (
    <section className="sheet-stack p-6">
      <h2 className="font-serif text-2xl text-deep-ink">{title}</h2>
      <p className="mb-5 text-sm text-muted-foreground">{note}</p>
      {children}
    </section>
  );
}

function Num({ label, unit, v, on }: { label: string; unit: string; v: number; on: (n: number) => void }) {
  return (
    <label className="rounded-xl border border-border bg-paper p-4 text-sm text-deep-ink">
      {label}
      <span className="mt-2 flex items-center gap-2 text-muted-foreground">
        <Input type="number" min={1} value={v} onChange={(e) => on(Math.max(1, Number(e.target.value)))} className="w-20 bg-sheet" />{unit}
      </span>
    </label>
  );
}
