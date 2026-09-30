import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site/SiteChrome";
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
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-xl px-5 py-10 sm:py-16">
        <div className="sheet-stack p-8 text-center">{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Missed() {
  return (
    <>
      <h1 className="t-page text-deep-ink">Just missed it.</h1>
      <p className="mt-4 text-deep-ink/70">Someone claimed this time a moment before you. You're still on the waitlist, and we'll write the moment another spot opens.</p>
      <Button asChild variant="outline" className="mt-8"><Link to="/">Back to home</Link></Button>
    </>
  );
}

function ClaimPage() {
  const { token } = Route.useParams();
  const fetchOffer = useServerFn(getOffer);
  const claim = useServerFn(claimOffer);
  const q = useQuery({ queryKey: ["offer", token], queryFn: () => fetchOffer({ data: { token } }) });
  const [state, setState] = useState<"idle" | "busy" | "missed" | { token: string }>("idle");

  if (q.isLoading) return <Shell><div role="status" aria-label="Loading" className="space-y-4"><Skeleton className="mx-auto h-5 w-36" /><Skeleton className="mx-auto h-9 w-64 max-w-full" /><Skeleton className="mx-auto h-6 w-44" /><Skeleton className="mx-auto mt-8 h-10 w-full" /></div></Shell>;
  if (q.isError || !q.data) return <Shell><h1 className="t-page text-deep-ink">This link isn't working.</h1><p className="mt-4 text-deep-ink/70">It may have expired. You're still on the waitlist.</p></Shell>;
  if (state === "missed" || (state === "idle" && q.data.status !== "open")) return <Shell><Missed /></Shell>;
  if (typeof state === "object") {
    return (
      <Shell>
        <h1 className="t-page text-deep-ink">It's yours.</h1>
        <p className="mt-4 text-deep-ink/70">{fmtDateLong(q.data.slotStart)} at {fmtTime(q.data.slotStart)}. A confirmation is on its way with your document checklist.</p>
        <Button asChild className="mt-8"><Link to="/a/$token" params={{ token: state.token }}>Open your checklist</Link></Button>
      </Shell>
    );
  }
  return (
    <Shell>
      <p className="text-sm text-ink/70">A spot opened up</p>
      <h1 className="mt-3 t-page text-deep-ink">{fmtDateLong(q.data.slotStart)}</h1>
      <p className="mt-2 text-lg tabular text-deep-ink">{fmtTime(q.data.slotStart)}, {q.data.service}, {q.data.minutes} min</p>
      <p className="mt-4 text-deep-ink/70">First to claim it gets it. No payment now.</p>
      <Button size="lg" className="mt-8 w-full" disabled={state === "busy"} onClick={async () => {
        setState("busy");
        try {
          const r = await claim({ data: { token } });
          setState(r.ok ? { token: r.manageToken } : "missed");
        } catch { setState("missed"); }
      }}>
        {state === "busy" ? <Loader2 className="size-4 " /> : "Claim this time"}
      </Button>
    </Shell>
  );
}
