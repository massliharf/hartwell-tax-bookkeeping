import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CalendarPlus, Check, Download, Lock, Users, Video, RotateCcw, Link as LinkIcon } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BookingShell, ResultPanel } from "@/components/booking/BookingShell";
import { DIRECTIONS, OFFICE, downloadIcs, gcalStamp } from "@/lib/meeting";
import { getAppointmentByToken } from "@/lib/portal.functions";
import { fmtDateLong, fmtTime } from "@/lib/intake";

export const Route = createFileRoute("/book/confirmed")({
  validateSearch: z.object({ token: z.string().min(10).max(100).optional() }),
  head: () => ({
    meta: [
      { title: "You're booked — Hartwell Tax & Bookkeeping" },
      { name: "description", content: "Your appointment is confirmed." },
      { property: "og:title", content: "You're booked — Hartwell Tax & Bookkeeping" },
      { property: "og:description", content: "Your appointment with Claire Hartwell, EA is confirmed." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ConfirmedPage,
});

const ADDRESS = "412 Bloomfield Avenue, Montclair, NJ 07042";


function ConfirmedPage() {
  const { token } = Route.useSearch();
  const fetchAppt = useServerFn(getAppointmentByToken);
  const q = useQuery({ queryKey: ["appt", token], queryFn: () => fetchAppt({ data: { token: token! } }), enabled: !!token });

  if (q.isError) {
    return (
      <BookingShell>
        <ResultPanel icon={<RotateCcw />} tone="warning" title="Your appointment didn't load." actions={<><Button size="lg" onClick={() => q.refetch()}>Try again</Button><Button asChild size="lg" variant="secondary"><Link to="/book/returning">Email me my link</Link></Button></>}>
          Your appointment is still booked. This page just couldn't load it.
        </ResultPanel>
      </BookingShell>
    );
  }
  if (!token || (q.data && !q.data.appointment)) {
    return (
      <BookingShell>
        <ResultPanel icon={<LinkIcon />} tone="warning" title="We couldn't find that appointment." actions={<><Button asChild size="lg"><Link to="/book/returning">Email me my link</Link></Button><Button asChild size="lg" variant="secondary"><Link to="/book">Schedule an appointment</Link></Button></>}>
          Check the link in your confirmation email, or we can send you a fresh one.
        </ResultPanel>
      </BookingShell>
    );
  }
  if (q.isLoading || !q.data?.appointment) {
    return <BookingShell><div className="mx-auto max-w-2xl"><Skeleton className="mx-auto size-16 rounded-full" /><Skeleton className="mx-auto mt-6 h-10 w-56" /><Skeleton className="mx-auto mt-3 h-5 w-64" /><Skeleton className="mt-10 h-52 rounded-2xl" /><Skeleton className="mt-8 h-80 rounded-2xl" /></div></BookingShell>;
  }

  const a = q.data.appointment as {
    start_at: string; end_at: string; meeting_type: "in_person" | "video"; ready_score: number;
    services: { name: string } | null; clients: { name: string } | null; intake_answers?: Record<string, unknown> | null;
  };
  const pending = !!a.intake_answers?.["intake_pending"];
  const items = (q.data.checklist ?? []) as { id: string; document_name: string; description: string | null; required: boolean; status: string }[];
  const service = a.services?.name ?? "Appointment";
  const first = a.clients?.name?.split(" ")[0] ?? "";
  const videoLink = (q.data as { videoLink?: string | null }).videoLink ?? null;
  const where = a.meeting_type === "video" ? (videoLink ?? "Video call") : ADDRESS;
  const title = `${service} with Claire Hartwell, EA`;
  const manageUrl = typeof window !== "undefined" ? `${window.location.origin}/a/${token}` : "";
  const details = `Upload your documents: ${manageUrl}`;
  const gcal = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${gcalStamp(a.start_at)}/${gcalStamp(a.end_at)}&location=${encodeURIComponent(where)}&details=${encodeURIComponent(details)}`;

  return (
    <BookingShell>
      <div className="reveal-children mx-auto max-w-2xl">
        <div className="text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-full bg-alert-success text-alert-success-fg"><Check className="size-5" strokeWidth={2.5} /></span>
          <h1
            className="mt-5 t-page text-deep-ink">
            You're booked{first && `, ${first}`}.
          </h1>
          <p className="mt-3 text-[15px] text-muted-foreground">
            We've emailed you a confirmation.
          </p>
        </div>

        <div
          className="mt-10 rounded-xl border border-line-1 bg-sheet p-6">
          <p className="text-[11px] font-medium text-muted-foreground">{service}</p>
          <p className="mt-1 t-card text-deep-ink">{fmtDateLong(a.start_at)}</p>
          <p className="tabular mt-1 text-deep-ink/80">{fmtTime(a.start_at)} – {fmtTime(a.end_at)}</p>
          {/* Where it happens, in full: the join link, or the address with parking and directions. */}
          {a.meeting_type === "video" ? (
            <div className="mt-4 rounded-lg bg-surface-2 p-3">
              <p className="flex items-center gap-2 text-sm font-medium text-deep-ink"><Video className="size-4" />Video call</p>
              {videoLink && <p className="mt-1 break-all text-sm text-ink">{videoLink}</p>}
              <p className="mt-1 text-xs text-muted-foreground">Works in your browser, no app needed. We'll also email the link the day before.</p>
              {videoLink && <Button size="sm" variant="secondary" className="mt-3" onClick={() => { void navigator.clipboard?.writeText(videoLink); }}><LinkIcon />Copy link</Button>}
            </div>
          ) : (
            <div className="mt-4 rounded-lg bg-surface-2 p-3">
              <p className="flex items-center gap-2 text-sm font-medium text-deep-ink"><Users className="size-4" />In person</p>
              <p className="mt-1 text-sm text-deep-ink">{OFFICE.line1}, {OFFICE.line2}</p>
              <p className="mt-1 text-xs text-muted-foreground">{OFFICE.parking}</p>
              <Button size="sm" variant="secondary" className="mt-3" asChild><a href={DIRECTIONS} target="_blank" rel="noreferrer">Directions</a></Button>
            </div>
          )}
          <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">
            <Button variant="outline" size="sm" onClick={() => downloadIcs(title, a.start_at, a.end_at, where, details)}><Download /> Add to calendar (.ics)</Button>
            <Button variant="outline" size="sm" asChild><a href={gcal} target="_blank" rel="noreferrer"><CalendarPlus /> Google Calendar</a></Button>
          </div>
        </div>

        {items.length === 0 && !pending ? (
          <div className="mt-6 rounded-xl border border-line-2 bg-sheet p-5 sm:p-6">
            <p className="t-card text-deep-ink">What happens next</p>
            <p className="mt-2 text-[15px] leading-6 text-muted-foreground">At your appointment time, open your appointment page and click Join. We'll also email you the link the day before. You don't need to prepare anything.</p>
            <Button asChild size="lg" variant="secondary" className="mt-5"><Link to="/a/$token" params={{ token: token! }}>Open your appointment</Link></Button>
          </div>
        ) : pending ? (
        <div className="mt-6 overflow-hidden rounded-xl border border-line-2 bg-sheet">
          <p className="bg-deep-ink px-5 py-2.5 text-[13px] font-bold text-white">One more step</p>
          <div className="p-5 sm:p-6">
            <p className="t-card text-deep-ink">Tell us about your year.</p>
            <p className="mt-2 text-[15px] leading-6 text-muted-foreground">Answer a few yes-or-no questions, like whether you have a mortgage or freelance income. We'll turn your answers into a checklist of exactly which documents to bring.</p>
            <Button asChild size="lg" className="mt-5 w-full sm:w-auto">
              <Link to="/a/$token" params={{ token: token! }}>Answer the questions</Link>
            </Button>
            <p className="mt-3 text-[13px] text-muted-foreground">You can also do this later from the link in your confirmation email.</p>
          </div>
          <p className="flex items-start gap-2 border-t border-line-1 bg-surface-2 px-5 py-3 text-xs text-muted-foreground">
            <Lock className="mt-0.5 size-3.5 shrink-0" /> Your files are stored privately. Only Claire can open them.
          </p>
        </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-xl border border-line-2 bg-sheet">
             <div className="border-b border-line-1 bg-surface-2 px-5 py-3">
              <p className="t-card text-deep-ink">What to bring</p>
              <p className="mt-1 text-sm text-muted-foreground">Upload them any time before your appointment.</p>
            </div>
            <ul className="divide-y divide-line-1">
              {items.map((i) => (
                 <li key={i.id} className="flex items-start gap-3 px-5 py-2 text-sm">
                  <span className="mt-0.5 size-4 shrink-0 rounded-[4px] border-[1.5px] border-line-3" />
                  <span><span className="block text-deep-ink">{i.document_name}</span>{i.description && <span className="block text-xs text-muted-foreground">{i.description}</span>}</span>
                </li>
              ))}
            </ul>
             <div className="border-t border-line-1 px-5 py-4">
              <Button asChild size="lg" className="w-full sm:w-auto"><Link to="/a/$token" params={{ token: token! }}>Upload your documents</Link></Button>
            </div>
            <p className="flex items-start gap-2 border-t border-line-1 bg-surface-2 px-5 py-3 text-xs text-muted-foreground">
              <Lock className="mt-0.5 size-3.5 shrink-0" /> Your files are stored privately. Only Claire can open them.
            </p>
          </div>
        )}
      </div>
    </BookingShell>
  );
}
