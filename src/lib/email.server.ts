// Email + SMS delivery with a single log in `messages`. Every send is claimed
// first via a unique dedupe_key, so the same message can never go out twice.
import type { Database } from "@/integrations/supabase/types";

type MsgType = Database["public"]["Enums"]["message_type"];
const TZ = "America/New_York";
const FROM_DEFAULT = "Claire Hartwell, EA <onboarding@resend.dev>";

export const fmtDate = (iso: string) =>
  new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "long", month: "long", day: "numeric" }).format(new Date(iso));
export const fmtTime = (iso: string) =>
  new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", minute: "2-digit" }).format(new Date(iso));
export const OFFICE = "412 Bloomfield Avenue, Montclair, NJ 07042";
export const MAP_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("412 Bloomfield Avenue, Montclair, NJ 07042")}`;

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export type Block =
  | { p: string }
  | { list: string[] }
  | { button: { label: string; href: string } }
  | { buttons: { label: string; href: string }[] }
  | { note: string };

/** Brand email (DESIGN_SYSTEM v2): canvas grey, white card, Hartwell blue buttons, logo tile. Table layout for mail clients. */
export function renderEmail(heading: string, blocks: Block[]) {
  const body = blocks.map((b) => {
    if ("p" in b) return `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#353535">${esc(b.p)}</p>`;
    if ("note" in b) return `<p style="margin:0 0 16px;font-size:13px;line-height:1.5;color:#737373">${esc(b.note)}</p>`;
    if ("list" in b) return `<table role="presentation" width="100%" style="margin:0 0 20px;border-collapse:collapse;border:1px solid #EAEAEA;border-radius:12px">${b.list.map((i, n) =>
      `<tr><td style="padding:12px 14px;${n ? "border-top:1px solid #EAEAEA;" : ""}font-size:14px;color:#1A1A1A"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#E7AD16;margin-right:10px;vertical-align:middle"></span>${esc(i)}</td></tr>`).join("")}</table>`;
    const btns = "button" in b ? [b.button] : b.buttons;
    return btns.map((x, i) => `<a href="${esc(x.href)}" style="display:block;text-align:center;margin:0 0 10px;padding:13px 20px;border-radius:8px;font-size:15px;font-weight:600;text-decoration:none;${i === 0 ? "background:#2F54EB;color:#FFFFFF" : "background:#F0F0F0;color:#1A1A1A"}">${esc(x.label)}</a>`).join("");
  }).join("");
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F5F5F5;font-family:Geist,Inter,Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" style="background:#F5F5F5"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" style="max-width:520px">
<tr><td style="padding:0 4px 16px"><table role="presentation"><tr>
<td style="width:28px;height:28px;background:#2F54EB;border-radius:8px;text-align:center;vertical-align:middle;color:#FFFFFF;font-weight:700;font-size:15px;line-height:28px">H</td>
<td style="padding-left:10px;font-size:15px;font-weight:600;color:#1A1A1A">Hartwell <span style="font-weight:400;color:#737373">Tax &amp; Bookkeeping</span></td>
</tr></table></td></tr>
<tr><td style="background:#FFFFFF;border:1px solid rgba(16,16,16,0.06);border-radius:16px;padding:32px 28px">
<h1 style="margin:0 0 18px;font-family:Figtree,Geist,Helvetica,Arial,sans-serif;font-weight:600;font-size:26px;line-height:1.2;letter-spacing:-0.01em;color:#1A1A1A">${esc(heading)}</h1>
${body}
<p style="margin:24px 0 0;font-size:14px;line-height:1.5;color:#353535">Warmly,<br><strong style="color:#1A1A1A">Claire Hartwell, EA</strong></p>
</td></tr>
<tr><td style="padding:16px 4px;font-size:12px;line-height:1.5;color:#737373">${OFFICE} &middot; (973) 555-0142<br>We never ask for your Social Security number by email.</td></tr>
</table></td></tr></table></body></html>`;
}

export function toText(heading: string, blocks: Block[]) {
  return [heading, "", ...blocks.map((b) =>
    "p" in b ? b.p : "note" in b ? b.note : "list" in b ? b.list.map((i) => `- ${i}`).join("\n")
      : ("button" in b ? [b.button] : b.buttons).map((x) => `${x.label}: ${x.href}`).join("\n")), "", "Claire Hartwell, EA"].join("\n\n");
}

export function buildIcs(o: { id: string; start: string; end: string; title: string; location: string; description: string }) {
  const f = (d: string) => new Date(d).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const e = (s: string) => s.replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Hartwell Tax//Booking//EN", "METHOD:PUBLISH", "BEGIN:VEVENT",
    `UID:${o.id}@hartwelltax`, `DTSTAMP:${f(new Date().toISOString())}`, `DTSTART:${f(o.start)}`, `DTEND:${f(o.end)}`,
    `SUMMARY:${e(o.title)}`, `LOCATION:${e(o.location)}`, `DESCRIPTION:${e(o.description)}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
}

type SendArgs = {
  dedupeKey: string;
  type: MsgType;
  minutesSaved: number;
  clientId: string | null;
  appointmentId?: string | null;
  to: string;
  subject: string;
  heading: string;
  blocks: Block[];
  ics?: string;
  sms?: string; // also log a simulated SMS
};

/** Returns true if this call sent it, false if it was already sent before. */
export async function sendMessage(a: SendArgs): Promise<boolean> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { getNow } = await import("./clock.server");
  const now = (await getNow()).toISOString();
  const text = toText(a.heading, a.blocks);
  const { data: claimed, error } = await supabaseAdmin.from("messages").insert({
    dedupe_key: a.dedupeKey, type: a.type, channel: "email", client_id: a.clientId, appointment_id: a.appointmentId ?? null,
    subject: a.subject, body: text, sent_at: now, minutes_saved: a.minutesSaved, recipient: a.to, delivery: "pending",
  }).select("id").maybeSingle();
  if (error || !claimed) return false; // unique dedupe_key → already sent

  let delivery = "sent";
  let err: string | null = null;
  const key = process.env["RESEND_API_KEY"];
  if (!key) delivery = "simulated";
  else if (/@example\.(com|org|net)$/i.test(a.to)) delivery = "simulated"; // demo clients
  else {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env["RESEND_FROM"] || FROM_DEFAULT,
        to: [a.to], subject: a.subject, html: renderEmail(a.heading, a.blocks), text,
        ...(a.ics ? { attachments: [{ filename: "appointment.ics", content: btoa(a.ics) }] } : {}),
      }),
    });
    if (!res.ok) {
      delivery = "failed";
      err = `[${res.status}] ${(await res.text()).slice(0, 400)}`;
      console.error("Resend failed", err);
    }
  }
  await supabaseAdmin.from("messages").update({ delivery, error: err }).eq("id", claimed.id);

  if (a.sms) {
    await supabaseAdmin.from("messages").insert({
      dedupe_key: `${a.dedupeKey}:sms`, type: a.type, channel: "sms", client_id: a.clientId, appointment_id: a.appointmentId ?? null,
      body: a.sms, sent_at: now, minutes_saved: 0, delivery: "simulated", recipient: a.to,
    });
  }
  return true;
}
