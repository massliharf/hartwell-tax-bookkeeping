/**
 * Where an appointment happens, in one place. Video: always a working link, so nobody has to email one by hand.
 * If Claire set her own Zoom/Meet link in Settings it's used; otherwise each appointment gets its own private room.
 * In person: the office address, a map and directions.
 */
export const OFFICE = { line1: "412 Bloomfield Avenue", line2: "Montclair, NJ 07042", parking: "Free street parking on Bloomfield Ave; the entrance is next to the bakery." };
export const OFFICE_ADDRESS = `${OFFICE.line1}, ${OFFICE.line2}`;
export const MAP_EMBED = `https://www.google.com/maps?q=${encodeURIComponent(OFFICE_ADDRESS)}&output=embed`;
export const DIRECTIONS = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(OFFICE_ADDRESS)}`;
export const OFFICE_PHONE = "(973) 555-0142";
export const OFFICE_PHONE_HREF = "tel:+19735550142";
export const OFFICE_EMAIL = "claire@hartwelltax.com";
export const OFFICE_EMAIL_HREF = `mailto:${OFFICE_EMAIL}`;

/** A private, per-appointment room (no account needed to join) when no personal link is set. */
export function meetingLink(settingsLink: string | null | undefined, appointmentId: string) {
  const own = settingsLink?.trim();
  if (own) return own;
  return `https://meet.jit.si/HartwellTax-${appointmentId.replace(/-/g, "").slice(0, 16)}`;
}

/** Join opens 10 minutes before the start and closes when the appointment ends. */
export function joinState(startIso: string, endIso: string, nowIso: string): "early" | "open" | "over" {
  const now = Date.parse(nowIso), start = Date.parse(startIso), end = Date.parse(endIso);
  if (now >= end) return "over";
  return now >= start - 10 * 60e3 ? "open" : "early";
}

export const gcalStamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

/** Google Calendar's `ctz` applies to local date/time strings, not UTC `Z` stamps. */
const newYorkCalendarStamp = (iso: string) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}${part("month")}${part("day")}T${part("hour")}${part("minute")}${part("second")}`;
};

/** Open Google's event form with New York appointment instants; the visitor chooses Save there. */
export function googleCalendarLink(title: string, start: string, end: string, where: string, details: string) {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${newYorkCalendarStamp(start)}/${newYorkCalendarStamp(end)}`,
    ctz: "America/New_York",
    location: where,
    details,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** Save the appointment to the phone or computer calendar (.ics), same file the confirmation email attaches. */
export function downloadIcs(title: string, start: string, end: string, where: string, details: string) {
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
