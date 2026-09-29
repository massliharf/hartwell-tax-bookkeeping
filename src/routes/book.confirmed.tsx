import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion, useReducedMotion } from "framer-motion";
import { CalendarPlus, Check, Download, Lock, Upload, Users, Video } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { DocumentStack } from "@/components/brand/DocumentStack";
import { ReadyRing } from "@/components/brand/ReadyRing";
import { BookingShell } from "@/components/booking/BookingShell";
import { getAppointmentByToken } from "@/lib/portal.functions";
import { fmtDateLong, fmtTime } from "@/lib/intake";
import { buildIcs } from "@/lib/email.server";

export const Route = createFileRoute("/book/confirmed")({
  validateSearch: z.object({ token: z.string().min(10).max(100).optional() }),
  head: () => ({
    meta: [
      { title: "You're booked — Patel Tax & Bookkeeping" },
      { name: "description", content: "Your appointment is confirmed." },
      { property: "og:title", content: "You're booked — Patel Tax & Bookkeeping" },
      { property: "og:description", content: "Your appointment with Priya Patel, EA is confirmed." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ConfirmedPage,
});

const ADDRESS = "Oak Tree Road, Edison, NJ";
const gcalStamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

function downloadIcs(title: string, start: string, end: string, where: string, details: string) {
  const ics = buildIcs({ id: `${gcalStamp(start)}-patel-tax`, start, end, title, location: where, description: details });
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  const a = document.createElement("a");
  a.href = url; a.download = "patel-tax-appointment.ics"; a.click();
  URL.revokeObjectURL(url);
}

function ConfirmedPage() {
  const { token } = Route.useSearch();
  const fetchAppt = useServerFn(getAppointmentByToken);
  const reduce = useReducedMotion();
  const q = useQuery({ queryKey: ["appt", token], queryFn: () => fetchAppt({ data: { token: token! } }), enabled: !!token });

  if (!token || (q.data && !q.data.appointment) || q.isError) {
    return (
      <BookingShell>
        <div className="mx-auto max-w-md text-center">
          <h1 className="text-4xl text-deep-ink">We couldn't find that booking</h1>
          <p className="mt-3 text-deep-ink/70">Check the link in your confirmation email, or book again.</p>
          <Button asChild size="lg" className="mt-6"><Link to="/book">Book an appointment</Link></Button>
        </div>
      </BookingShell>
    );
  }
  if (q.isLoading || !q.data?.appointment) {
    return <BookingShell><div className="mx-auto h-96 max-w-2xl animate-pulse rounded-2xl bg-sheet/60" /></BookingShell>;
  }

  const a = q.data.appointment as {
    start_at: string; end_at: string; meeting_type: "in_person" | "video"; ready_score: number;
    services: { name: string } | null; clients: { name: string } | null;
  };
  const items = q.data.checklist;
  const service = a.services?.name ?? "Appointment";
  const first = a.clients?.name?.split(" ")[0] ?? "";
  const where = a.meeting_type === "video" ? "Video call (link will be emailed)" : ADDRESS;
  const title = `${service} with Priya Patel, EA`;
  const manageUrl = typeof window !== "undefined" ? `${window.location.origin}/a/${token}` : "";
  const details = `Upload your documents: ${manageUrl}`;
  const gcal = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${gcalStamp(a.start_at)}/${gcalStamp(a.end_at)}&location=${encodeURIComponent(where)}&details=${encodeURIComponent(details)}`;

  return (
    <BookingShell>
      <div className="mx-auto max-w-2xl">
        <div className="text-center">
          <motion.div
            initial={reduce ? false : { scale: 0, rotate: -40 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 16, delay: 0.25 }}
            className="mx-auto grid size-16 place-items-center rounded-full bg-ink text-paper shadow-sheet"
          >
            <Check className="size-8" strokeWidth={2.5} />
          </motion.div>
          <motion.h1 initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
            className="mt-6 text-5xl leading-tight text-deep-ink sm:text-6xl">
            You're booked{first && `, ${first}`}.
          </motion.h1>
          <motion.p initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-3 text-deep-ink/70">
            A confirmation is on its way to your inbox.
          </motion.p>
        </div>

        <motion.div initial={reduce ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, type: "spring", damping: 22 }}
          className="sheet-stack mt-10 p-6">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{service}</p>
          <p className="mt-1 font-serif text-3xl text-deep-ink">{fmtDateLong(a.start_at)}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-deep-ink/80">
            <span className="tabular">{fmtTime(a.start_at)} – {fmtTime(a.end_at)}</span>
            <span className="inline-flex items-center gap-1.5">
              {a.meeting_type === "video" ? <Video className="size-4" /> : <Users className="size-4" />}
              {a.meeting_type === "video" ? "Video call" : `In person · ${ADDRESS}`}
            </span>
          </div>
          <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">
            <Button variant="outline" size="sm" onClick={() => downloadIcs(title, a.start_at, a.end_at, where, details)}><Download /> Add to calendar (.ics)</Button>
            <Button variant="outline" size="sm" asChild><a href={gcal} target="_blank" rel="noreferrer"><CalendarPlus /> Google Calendar</a></Button>
          </div>
        </motion.div>

        <motion.div initial={reduce ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, type: "spring", damping: 22 }}
          className="sheet-stack ledger mt-8 p-6">
          <div className="flex items-center gap-5">
            <ReadyRing value={a.ready_score} size={84} />
            <div className="min-w-0">
              <p className="font-serif text-3xl text-deep-ink">Your checklist</p>
              <p className="text-sm text-deep-ink/70"><span className="tabular">{items.length}</span> documents to bring. Send them ahead and Priya will check everything before you arrive.</p>
            </div>
          </div>
          <div className="mt-6">
            <DocumentStack docs={items.map((i) => ({ id: i.id, title: i.document_name, note: i.description ?? (i.required ? "Needed" : "If you have it"), received: i.status === "uploaded" }))} />
          </div>
          <Button asChild size="lg" variant="highlight" className="mt-6 w-full">
            <Link to="/a/$token" params={{ token: token! }}><Upload /> Upload your documents now</Link>
          </Button>
          <p className="mt-3 text-center text-sm text-muted-foreground">or do it later — we'll remind you</p>
          <p className="mt-5 flex items-start gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
            <Lock className="mt-0.5 size-3.5 shrink-0" /> Your files go to private storage that only Priya can open. We'll never ask for your Social Security number online.
          </p>
        </motion.div>
      </div>
    </BookingShell>
  );
}
