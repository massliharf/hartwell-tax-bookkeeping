import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site/SiteChrome";
import { Button } from "@/components/ui/button";
import { claimOffer, getOffer } from "@/lib/automations.functions";
import { fmtDateLong, fmtTime } from "@/lib/intake";

export const Route = createFileRoute("/claim/$token")({
  head: () => ({
    meta: [
      { title: "A spot opened up — Patel Tax & Bookkeeping" },
      { name: "description", content: "Claim an open appointment with Priya Patel, EA." },
      { property: "og:title", content: "A spot opened up — Patel Tax & Bookkeeping" },
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
      <main className="mx-auto max-w-xl px-5 py-16 sm:py-24">
        <div className="sheet-stack ledger p-8 text-center">{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Missed() {
  return (
    <>
      <h1 className="font-serif text-4xl text-deep-ink">Just missed it.</h1>
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

  if (q.isLoading) return <Shell><Loader2 className="mx-auto size-6 animate-spin text-ink" aria-label="Loading" /></Shell>;
  if (q.isError || !q.data) return <Shell><h1 className="font-serif text-4xl text-deep-ink">This link isn't working.</h1><p className="mt-4 text-deep-ink/70">It may have expired. You're still on the waitlist.</p></Shell>;
  if (state === "missed" || (state === "idle" && q.data.status !== "open")) return <Shell><Missed /></Shell>;
  if (typeof state === "object") {
    return (
      <Shell>
        <h1 className="font-serif text-4xl text-deep-ink">It's yours.</h1>
        <p className="mt-4 text-deep-ink/70">{fmtDateLong(q.data.slotStart)} at {fmtTime(q.data.slotStart)}. A confirmation is on its way with your document checklist.</p>
        <Button asChild className="mt-8"><Link to="/a/$token" params={{ token: state.token }}>Open your checklist</Link></Button>
      </Shell>
    );
  }
  return (
    <Shell>
      <p className="text-sm uppercase tracking-widest text-ink/70">A spot opened up</p>
      <h1 className="mt-3 font-serif text-4xl text-deep-ink">{fmtDateLong(q.data.slotStart)}</h1>
      <p className="mt-2 text-lg tabular text-deep-ink">{fmtTime(q.data.slotStart)} · {q.data.service} · {q.data.minutes} min</p>
      <p className="mt-4 text-deep-ink/70">First to claim it gets it. No payment now.</p>
      <Button size="lg" className="mt-8 w-full" disabled={state === "busy"} onClick={async () => {
        setState("busy");
        try {
          const r = await claim({ data: { token } });
          setState(r.ok ? { token: r.manageToken } : "missed");
        } catch { setState("missed"); }
      }}>
        {state === "busy" ? <Loader2 className="size-4 animate-spin" /> : "Claim this time"}
      </Button>
    </Shell>
  );
}
