import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getAvailabilityWindow } from "@/lib/booking.functions";

const tz = "America/New_York";

/** One honest line of availability: the next open time for an individual return, live. Tapping it holds that time. */
export function NextOpen() {
  const svc = useQuery({
    queryKey: ["svc-individual"],
    queryFn: async () => (await supabase.from("services").select("id, slug").eq("slug", "individual").maybeSingle()).data,
  });
  const fetchWindow = useServerFn(getAvailabilityWindow);
  const q = useQuery({ queryKey: ["availability", svc.data?.id], enabled: !!svc.data, staleTime: 30_000, queryFn: () => fetchWindow({ data: { serviceId: svc.data!.id, days: 21 } }) });
  const next = (q.data?.days ?? []).flatMap((d) => d.slots).find((x) => new Date(x).getUTCMinutes() % 30 === 0);
  if (!next) return <span className="text-white/70">Checking this week's openings…</span>;
  const label = `${new Date(next).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", timeZone: tz })} at ${new Date(next).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: tz })}`;
  return (
    <Link to="/book" search={{ service: "individual", start: next }} className="group inline-flex flex-col">
      <span className="text-[13px] text-white/70">Next opening</span>
      <span className="text-[17px] font-medium text-white underline-offset-4 group-hover:underline">{label}</span>
    </Link>
  );
}
