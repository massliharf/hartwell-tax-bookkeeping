import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CalendarPlus, Check, Download, Lock, Users, Video, RotateCcw, Link as LinkIcon } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BookingShell, ResultPanel } from "@/components/booking/BookingShell";
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
const gcalStamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

function downloadIcs(title: string, start: string, end: string, where: string, details: string) {
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Hartwell Tax//Booking//EN", "BEGIN:VEVENT",
    `UID:${gcalStamp(start)}-hartwell-tax`, `DTSTAMP:${gcalStamp(new Date().toISOString())}`,
    `DTSTART:${gcalStamp(start)}`, `DTEND:${gcalStamp(end)}`,
    `SUMMARY:${title}`, `LOCATION:${where}`, `DESCRIPTION:${details.replace(/\n/g, "\\n")}`,
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  const a = document.createElement("a");
  a.href = url; a.download = "hartwell-tax-appointment.ics"; a.click();
  URL.revokeObjectURL(url);
}

function ConfirmedPage() {
  const { token } = Route.useSearch();
  const fetchAppt = useServerFn(getAppointmentByToken);
  const q = useQuery({ queryKey: ["appt", token], queryFn: () => fetchAppt({ data: { token: token! } }), enabled: !!token });

  if (q.isError) {
    return (
      <BookingShell>
        <ResultPanel icon={<RotateCcw />} tone="warning" title="Your booking didn't load." actions={<><Button size="lg" onClick={() => q.refetch()}>Try again</Button><Button asChild size="lg" variant="secondary"><Link to="/book/returning">Email me my link</Link></Button></>}>
          Your appointment is still booked. This page just couldn't load it.
        </ResultPanel>
      </BookingShell>
    );
  }
  if (!token || (q.data && !q.data.appointment)) {
    return (
      <BookingShell>
        <ResultPanel icon={<LinkIcon />} tone="warning" title="We couldn't find that booking." actions={<><Button asChild size="lg"><Link to="/book/returning">Email me my link</Link></Button><Button asChild size="lg" variant="secondary"><Link to="/book">Book an appointment</Link></Button></>}>
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
    services: { name: string } | null; clients: { name: string } | null;
  };
  const service = a.services?.name ?? "Appointment";
  const first = a.clients?.name?.split(" ")[0] ?? "";
  const where = a.meeting_type === "video" ? "Video call (link will be emailed)" : ADDRESS;
  const title = `${service} with Claire Hartwell, EA`;
  const manageUrl = typeof window !== "undefined" ? `${window.location.origin}/a/${token}` : "";
  const details = `Upload your documents: ${manageUrl}`;
  const gcal = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${gcalStamp(a.start_at)}/${gcalStamp(a.end_at)}&location=${encodeURIComponent(where)}&details=${encodeURIComponent(details)}`;

  return (
    <BookingShell>
      <div className="mx-auto max-w-2xl">
        <div className="text-center">
          <span className="enter-spot mx-auto grid size-12 place-items-center rounded-full bg-alert-success text-alert-success-fg"><Check className="size-5" strokeWidth={2.5} /></span>
          <h1
            className="mt-5 t-page text-deep-ink">
            You're booked{first && `, ${first}`}.
          </h1>
          <p className="mt-3 text-[15px] text-muted-foreground">
            A confirmation is on its way to your inbox.
          </p>
        </div>

        <div
          className="mt-10 rounded-xl border border-line-1 bg-sheet p-6">
          <p className="text-[11px] font-medium text-muted-foreground">{service}</p>
          <p className="mt-1 t-card text-deep-ink">{fmtDateLong(a.start_at)}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-deep-ink/80">
            <span className="tabular">{fmtTime(a.start_at)} – {fmtTime(a.end_at)}</span>
            <span className="inline-flex items-center gap-1.5">
              {a.meeting_type === "video" ? <Video className="size-4" /> : <Users className="size-4" />}
              {a.meeting_type === "video" ? "Video call" : `In person, ${ADDRESS}`}
            </span>
          </div>
          <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">
            <Button variant="outline" size="sm" onClick={() => downloadIcs(title, a.start_at, a.end_at, where, details)}><Download /> Add to calendar (.ics)</Button>
            <Button variant="outline" size="sm" asChild><a href={gcal} target="_blank" rel="noreferrer"><CalendarPlus /> Google Calendar</a></Button>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border border-line-2 bg-sheet">
          <p className="bg-deep-ink px-5 py-2.5 text-[13px] font-bold text-white">One more minute, and you're ready</p>
          <div className="p-5 sm:p-6">
            <p className="t-card text-deep-ink">Tell Claire about your year.</p>
            <p className="mt-2 text-[15px] leading-6 text-muted-foreground">Five yes-or-no questions, like whether you have a mortgage or freelance income. Your answers turn into the exact list of documents to bring, and you can send them from your phone.</p>
            <Button asChild size="lg" className="mt-5 w-full sm:w-auto">
              <Link to="/a/$token" params={{ token: token! }}>Answer the questions</Link>
            </Button>
            <p className="mt-3 text-[13px] text-muted-foreground">Not now? The link is in your confirmation email, and we'll remind you.</p>
          </div>
          <p className="flex items-start gap-2 border-t border-line-1 bg-surface-2 px-5 py-3 text-xs text-muted-foreground">
            <Lock className="mt-0.5 size-3.5 shrink-0" /> Your files go to private storage that only Claire can open. We never ask for your Social Security number online.
          </p>
        </div>
      </div>
    </BookingShell>
  );
}
