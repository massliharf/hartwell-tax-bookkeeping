import { createFileRoute } from "@tanstack/react-router";

const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
const stamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

// Read-only calendar feed for Google Calendar, Apple Calendar or Outlook ("subscribe by URL").
export const Route = createFileRoute("/api/public/calendar/$token")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const token = params.token.replace(/\.ics$/, "");
        const { isCalendarToken } = await import("@/lib/integrations.server");
        if (!isCalendarToken(token)) return new Response("Not found", { status: 404 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const from = new Date(Date.now() - 30 * 86400e3).toISOString();
        const to = new Date(Date.now() + 120 * 86400e3).toISOString();
        const { data } = await supabaseAdmin.from("appointments")
          .select("id, start_at, end_at, status, meeting_type, ready_score, clients(name), services(name)")
          .gte("start_at", from).lt("start_at", to).not("status", "in", "(cancelled,rescheduled)").order("start_at");
        const now = stamp(new Date().toISOString());
        const events = (data ?? []).map((a) => {
          const client = (a.clients as { name: string } | null)?.name ?? "Client";
          const service = (a.services as { name: string } | null)?.name ?? "Appointment";
          return [
            "BEGIN:VEVENT",
            `UID:${a.id}@hartwell-tax`,
            `DTSTAMP:${now}`,
            `DTSTART:${stamp(a.start_at)}`,
            `DTEND:${stamp(a.end_at)}`,
            `SUMMARY:${esc(`${client}, ${service}`)}`,
            `DESCRIPTION:${esc(`${a.ready_score}% of documents in. ${a.meeting_type === "video" ? "Video call" : "In person"}.`)}`,
            a.status === "completed" || a.status === "no_show" ? "STATUS:CANCELLED" : "STATUS:CONFIRMED",
            "END:VEVENT",
          ].join("\r\n");
        });
        const body = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Hartwell Tax//Practice//EN", "CALSCALE:GREGORIAN", "X-WR-CALNAME:Hartwell Tax appointments", "X-WR-TIMEZONE:America/New_York", ...events, "END:VCALENDAR"].join("\r\n");
        return new Response(body, { headers: { "content-type": "text/calendar; charset=utf-8", "cache-control": "no-store" } });
      },
    },
  },
});
