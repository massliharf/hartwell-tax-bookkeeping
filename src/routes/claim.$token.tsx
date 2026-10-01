import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { CalendarCheck, Check, Clock, Link as LinkIcon, Loader2 } from "lucide-react";
import { BookingShell, ResultPanel } from "@/components/booking/BookingShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { claimOffer, getOffer } from "@/lib/automations.functions";
import { fmtDateLong, fmtTime } from "@/lib/intake";

export const Route = createFileRoute("/claim/$token")({
  head: () => ({
    meta: [
      { title: "A spot opened up — Hartwell Tax & Bookkeeping" },
      { name: "description", content: "Claim an open appointment with Claire Hartwell, EA." },
      { property: "og:title", content: "A spot opened up — Hartwell Tax & Bookkeeping" },
      { property: "og:description", content: "First to claim gets it." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ClaimPage,
});

function Shell({ children }: { children: React.ReactNode }) {
  return <BookingShell>{children}</BookingShell>;
}

function Missed() {
  return (
    <ResultPanel icon={<Clock />} title="Just missed it." actions={<Button asChild size="lg" variant="secondary"><Link to="/book">See other times</Link></Button>}>
      Someone claimed this time a moment before you. You're still on the waitlist, and we'll email you the moment another spot opens.
    </ResultPanel>
  );
}

function ClaimPage() {
  const { token } = Route.useParams();
  const fetchOffer = useServerFn(getOffer);
  const claim = useServerFn(claimOffer);
  const q = useQuery({ queryKey: ["offer", token], queryFn: () => fetchOffer({ data: { token } }), retry: false });
  const [state, setState] = useState<"idle" | "busy" | "missed" | { token: string }>("idle");

  if (q.isLoading) return <Shell><div role="status" aria-label="Loading" className="space-y-4"><Skeleton className="mx-auto h-5 w-36" /><Skeleton className="mx-auto h-9 w-64 max-w-full" /><Skeleton className="mx-auto h-6 w-44" /><Skeleton className="mx-auto mt-8 h-10 w-full" /></div></Shell>;
  if (q.isError) return <Shell><ResultPanel icon={<Clock />} tone="warning" title="This page didn't load." actions={<Button size="lg" onClick={() => q.refetch()}>Try again</Button>}>Your place on the waitlist is safe. Try again in a moment.</ResultPanel></Shell>;
  if (!q.data) return <Shell><ResultPanel icon={<LinkIcon />} tone="warning" title="This link isn't working." actions={<Button asChild size="lg" variant="secondary"><Link to="/book">See open times</Link></Button>}>It may have expired. You're still on the waitlist, and we'll email you when another spot opens.</ResultPanel></Shell>;
  if (state === "missed" || (state === "idle" && q.data.status !== "open")) return <Shell><Missed /></Shell>;
  if (typeof state === "object") {
    return (
      <Shell>
        <ResultPanel icon={<Check />} tone="success" title="It's yours." actions={<Button asChild size="lg"><Link to="/a/$token" params={{ token: state.token }}>Open your appointment</Link></Button>}>
          <strong>{fmtDateLong(q.data.slotStart)} at {fmtTime(q.data.slotStart)}</strong>. A confirmation is on its way with your document checklist.
        </ResultPanel>
      </Shell>
    );
  }
  return (
    <Shell>
      <ResultPanel icon={<CalendarCheck />} eyebrow="A spot opened up" title={`${fmtDateLong(q.data.slotStart)}, ${fmtTime(q.data.slotStart)}`}
        actions={<Button size="lg" className="w-full sm:w-auto" disabled={state === "busy"} onClick={async () => {
          setState("busy");
          try {
            const r = await claim({ data: { token } });
            setState(r.ok ? { token: r.manageToken } : "missed");
          } catch { setState("missed"); }
        }}>{state === "busy" && <Loader2 className="animate-spin" />}Claim this time</Button>}>
        {q.data.service}, {q.data.minutes} minutes. The first person to claim it gets it. No payment now.
      </ResultPanel>
    </Shell>
  );
}
