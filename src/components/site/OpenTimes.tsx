import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getAvailabilityWindow } from "@/lib/booking.functions";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Svc = { id: string; slug: string; name: string; duration_min: number };
const tz = "America/New_York";
const dayLabel = (ymd: string) => new Date(`${ymd}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
const time = (iso: string) => new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: tz });
const SHORT: Record<string, string> = { individual: "Individual", "self-employed": "Self-employed", rental: "Rental", extension: "Extension", bookkeeping: "Bookkeeping" };

/**
 * The front door: real open times, right on the homepage. Pick one and you go straight to booking with it held.
 * Same availability the booking page and Claire's calendar use, so what you see is what you get.
 */
export function OpenTimes() {
  const services = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const { data, error } = await supabase.from("services").select("id,name,slug,duration_min").eq("active", true).order("sort_order");
      if (error) throw error;
      return data as Svc[];
    },
  });
  const [slug, setSlug] = useState("individual");
  const svc = services.data?.find((s) => s.slug === slug) ?? services.data?.[0];
  const fetchWindow = useServerFn(getAvailabilityWindow);
  const avail = useQuery({ queryKey: ["availability", svc?.id], enabled: !!svc, staleTime: 30_000, queryFn: () => fetchWindow({ data: { serviceId: svc!.id, days: 14 } }) });
  const days = useMemo(() => (avail.data?.days ?? [])
    .map((d) => ({ ...d, slots: d.slots.filter((x) => new Date(x).getUTCMinutes() % 30 === 0) }))
    .filter((d) => d.slots.length).slice(0, 3), [avail.data]);
  const next = days[0]?.slots[0];

  return (
    <div className="rounded-[28px] border border-line-1 bg-sheet p-5 shadow-[0_30px_60px_-30px_rgba(44,20,10,0.25)] sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] font-medium text-deep-ink">Open times with Claire</p>
        <span className="flex items-center gap-1.5 text-[12px] text-muted-foreground"><span className="relative flex size-2"><span className="absolute inline-flex size-full animate-ping rounded-full bg-success/50 motion-reduce:hidden" /><span className="relative inline-flex size-2 rounded-full bg-success" /></span>Live</span>
      </div>
      <div role="tablist" aria-label="Service" className="-mx-1 mt-3 flex gap-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
        {(services.data ?? []).map((s) => (
          <button key={s.slug} role="tab" aria-selected={s.slug === svc?.slug} type="button" onClick={() => setSlug(s.slug)}
            className={cn("h-10 shrink-0 rounded-full px-3 text-[12.5px] font-medium transition-colors duration-150 sm:h-8", s.slug === svc?.slug ? "bg-deep-ink text-white" : "bg-tint-1 text-body hover:bg-tint-2")}>
            {SHORT[s.slug] ?? s.name}
          </button>
        ))}
      </div>
      <div className="mt-4 min-h-[212px]">
        {(services.isLoading || avail.isLoading) && <div className="space-y-4">{[0, 1, 2].map((i) => <div key={i}><Skeleton className="h-3 w-24" /><div className="mt-2 grid grid-cols-4 gap-1.5">{[0, 1, 2, 3].map((j) => <Skeleton key={j} className="h-10 rounded-xl" />)}</div></div>)}</div>}
        {(services.isError || avail.isError || avail.data?.error) && <p className="pt-10 text-center text-sm text-muted-foreground">Times didn't load. <Link to="/book" className="font-medium text-ink underline">See all times</Link></p>}
        {avail.data && !avail.data.error && days.length === 0 && <p className="pt-10 text-center text-sm text-muted-foreground">The next two weeks are full. <Link to="/book" search={{ service: svc?.slug }} className="font-medium text-ink underline">Join the waitlist</Link></p>}
        {days.length > 0 && (
          <ul className="space-y-4">
            {days.map((d, di) => (
              <li key={d.date} className="enter-item" style={{ animationDelay: `${di * 70}ms` }}>
                <p className="text-[12px] font-medium text-muted-foreground">{dayLabel(d.date)}</p>
                <div className="mt-1.5 grid grid-cols-4 gap-1.5">
                  {d.slots.slice(0, 4).map((x) => (
                    <Link key={x} to="/book" search={{ service: svc!.slug, start: x }}
                      className="tabular grid h-10 place-items-center rounded-xl border border-line-1 text-[13px] font-medium text-deep-ink transition-[transform,background-color,border-color] duration-150 ease-expo hover:-translate-y-0.5 hover:border-ink hover:bg-ink-50 active:translate-y-0">
                      {time(x)}
                    </Link>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-line-1 pt-4 text-[12.5px]">
        <span className="text-muted-foreground">{next ? `Next: ${dayLabel(days[0]!.date)}, ${time(next)}` : "\u00a0"}{svc ? ` · ${svc.duration_min} min` : ""}</span>
        <Link to="/book" search={{ service: svc?.slug }} className="group inline-flex min-h-10 items-center gap-1 font-medium text-ink">All times<ArrowRight className="size-3.5 transition-transform duration-150 group-hover:translate-x-0.5" /></Link>
      </div>
    </div>
  );
}
