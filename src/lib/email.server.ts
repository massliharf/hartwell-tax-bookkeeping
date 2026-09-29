// Email + SMS delivery with a single log in `messages`. Every send is claimed
// first via a unique dedupe_key, so the same message can never go out twice.
import type { Database } from "@/integrations/supabase/types";

type MsgType = Database["public"]["Enums"]["message_type"];
const TZ = "America/New_York";
const FROM_DEFAULT = "Priya Patel, EA <onboarding@resend.dev>";

export const fmtDate = (iso: string) =>
  new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "long", month: "long", day: "numeric" }).format(new Date(iso));
export const fmtTime = (iso: string) =>
  new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", minute: "2-digit" }).format(new Date(iso));
export const OFFICE = "Oak Tree Road, Edison, NJ 08820";
export const MAP_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("Oak Tree Road, Edison, NJ")}`;

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export type Block =
  | { p: string }
  | { list: string[] }
  | { button: { label: string; href: string } }
  | { buttons: { label: string; href: string }[] }
  | { note: string };

/** Brand email: paper background, ink green, serif heading. Table layout for mail clients. */
export function renderEmail(heading: string, blocks: Block[]) {
  const body = blocks.map((b) => {
    if ("p" in b) return `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#16201B">${esc(b.p)}</p>`;
    if ("note" in b) return `<p style="margin:0 0 16px;font-size:13px;line-height:1.5;color:#5b6660">${esc(b.note)}</p>`;
    if ("list" in b) return `<table role="presentation" width="100%" style="margin:0 0 20px;border-collapse:collapse">${b.list.map((i) =>
      `<tr><td style="padding:10px 0;border-bottom:1px solid #e6dfcf;font-size:15px;color:#16201B"><span style="color:#E0A43A;font-weight:700">&#9675;</span>&nbsp;&nbsp;${esc(i)}</td></tr>`).join("")}</table>`;
    const btns = "button" in b ? [b.button] : b.buttons;
    return btns.map((x, i) => `<a href="${esc(x.href)}" style="display:block;text-align:center;margin:0 0 10px;padding:14px 20px;border-radius:999px;font-size:15px;font-weight:600;text-decoration:none;${i === 0 && "button" in b ? "background:#123B2F;color:#F5F1E8" : "background:#ffffff;color:#123B2F;border:1px solid #123B2F"}">${esc(x.label)}</a>`).join("") + `<div style="height:8px"></div>`;
  }).join("");
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F5F1E8;font-family:Inter,Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" style="background:#F5F1E8"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" style="max-width:520px">
<tr><td style="padding:0 4px 16px;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#123B2F">Patel Tax &amp; Bookkeeping</td></tr>
<tr><td style="background:#FFFDF8;border:1px solid #e6dfcf;border-radius:16px;padding:32px 28px;box-shadow:0 6px 0 -3px #efe9dc,0 10px 24px rgba(18,59,47,.06)">
<h1 style="margin:0 0 20px;font-family:'Instrument Serif',Georgia,serif;font-weight:400;font-size:32px;line-height:1.15;color:#123B2F">${esc(heading)}</h1>
${body}
<p style="margin:24px 0 0;font-size:15px;color:#16201B">Warmly,<br><span style="font-family:'Instrument Serif',Georgia,serif;font-size:20px;color:#123B2F">Priya Patel, EA</span></p>
</td></tr>
<tr><td style="padding:16px 4px;font-size:12px;line-height:1.5;color:#5b6660">${OFFICE} &middot; We never ask for your Social Security number by email.</td></tr>
</table></td></tr></table></body></html>`;
}

export function toText(heading: string, blocks: Block[]) {
  return [heading, "", ...blocks.map((b) =>
    "p" in b ? b.p : "note" in b ? b.note : "list" in b ? b.list.map((i) => `- ${i}`).join("\n")
      : ("button" in b ? [b.button] : b.buttons).map((x) => `${x.label}: ${x.href}`).join("\n")), "", "Priya Patel, EA"].join("\n\n");
}

export function buildIcs(o: { id: string; start: string; end: string; title: string; location: string; description: string }) {
  const f = (d: string) => new Date(d).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const e = (s: string) => s.replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Patel Tax//Booking//EN", "METHOD:PUBLISH", "BEGIN:VEVENT",
    `UID:${o.id}@pateltax`, `DTSTAMP:${f(new Date().toISOString())}`, `DTSTART:${f(o.start)}`, `DTEND:${f(o.end)}`,
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
      body: a.sms, sent_at: now, minutes_saved: 0, delivery: "simulated",
    });
  }
  return true;
}
