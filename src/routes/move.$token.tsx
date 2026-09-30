import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { CalendarClock, Check, Clock, Loader2 } from "lucide-react";
import { z } from "zod";
import { BookingShell, ResultPanel } from "@/components/booking/BookingShell";
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

  const back = <Button asChild size="lg" variant="secondary"><Link to="/a/$token" params={{ token }}>Open your appointment</Link></Button>;
  return (
    <BookingShell>
      {!to ? (
        <ResultPanel icon={<CalendarClock />} title="Pick a new time from your appointment page." actions={back} />
      ) : state === "done" ? (
        <ResultPanel icon={<Check />} tone="success" title="You're moved." actions={back}>
          New time: <strong>{fmtDateLong(to)} at {fmtTime(to)}</strong>. More time to gather your documents.
        </ResultPanel>
      ) : state === "taken" ? (
        <ResultPanel icon={<Clock />} tone="warning" title="That time was just taken." actions={back}>
          Your original appointment is still booked. You can pick another time from your appointment page.
        </ResultPanel>
      ) : (
        <ResultPanel icon={<CalendarClock />} eyebrow="Move your appointment to" title={`${fmtDateLong(to)}, ${fmtTime(to)}`}
          actions={<>
            <Button size="lg" disabled={state === "busy"} onClick={async () => {
              setState("busy");
              try { setState((await move({ data: { token, start: to } })).ok ? "done" : "taken"); } catch { setState("taken"); }
            }}>{state === "busy" && <Loader2 className="animate-spin" />}Yes, move it</Button>
            {back}
          </>}>
          Your documents and answers stay with the appointment.
        </ResultPanel>
      )}
    </BookingShell>
  );
}
