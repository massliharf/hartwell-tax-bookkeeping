import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { SiteFooter, SiteHeader } from "@/components/site/SiteChrome";
import { Button } from "@/components/ui/button";
import { rescheduleAppointment } from "@/lib/portal.functions";
import { fmtDateLong, fmtTime } from "@/lib/intake";

// One-tap reschedule from the 48-hour readiness email.
export const Route = createFileRoute("/move/$token")({
  validateSearch: z.object({ to: z.string().datetime({ offset: true }).optional() }),
  head: () => ({
    meta: [
      { title: "Move your appointment — Hartwell Tax & Bookkeeping" },
      { name: "description", content: "Move your appointment to a later time in one tap." },
      { property: "og:title", content: "Move your appointment — Hartwell Tax & Bookkeeping" },
      { property: "og:description", content: "Pick a later time so your visit counts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MovePage,
});

function MovePage() {
  const { token } = Route.useParams();
  const { to } = Route.useSearch();
  const move = useServerFn(rescheduleAppointment);
  const [state, setState] = useState<"idle" | "busy" | "done" | "taken">("idle");

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-xl px-5 py-10 sm:py-16">
        <div className="sheet-stack p-8 text-center">
          {!to ? (
            <h1 className="font-serif text-2xl leading-9 sm:text-[28px] sm:leading-[42px] text-deep-ink">Pick a time from your portal.</h1>
          ) : state === "done" ? (
            <>
              <h1 className="font-serif text-2xl leading-9 sm:text-[28px] sm:leading-[42px] text-deep-ink">You're moved.</h1>
              <p className="mt-4 text-deep-ink/70">New time: {fmtDateLong(to)} at {fmtTime(to)}. More time to gather your documents.</p>
            </>
          ) : state === "taken" ? (
            <>
              <h1 className="font-serif text-2xl leading-9 sm:text-[28px] sm:leading-[42px] text-deep-ink">That time was just taken.</h1>
              <p className="mt-4 text-deep-ink/70">Your original appointment is still booked. You can pick another time in your portal.</p>
            </>
          ) : (
            <>
              <p className="text-smst text-ink/70">Move to</p>
              <h1 className="mt-3 font-serif text-2xl leading-9 sm:text-[28px] sm:leading-[42px] text-deep-ink">{fmtDateLong(to)}</h1>
              <p className="mt-2 text-lg tabular text-deep-ink">{fmtTime(to)}</p>
              <Button size="lg" className="mt-8 w-full" disabled={state === "busy"} onClick={async () => {
                setState("busy");
                try { setState((await move({ data: { token, start: to } })).ok ? "done" : "taken"); } catch { setState("taken"); }
              }}>
                {state === "busy" ? <Loader2 className="size-4 " /> : "Yes, move my appointment"}
              </Button>
            </>
          )}
          <Link to="/a/$token" params={{ token }} className="mt-6 inline-block text-sm font-medium text-ink underline underline-offset-4">Open your portal</Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
