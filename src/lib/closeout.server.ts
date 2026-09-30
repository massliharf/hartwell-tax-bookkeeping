// Close-out emails: review/sign/pay, document fixes, payment reminders, filed.
import { sendMessage } from "./email.server";

const first = (n: string) => n.split(" ")[0] ?? n;
export const money = (cents: number) => `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: cents % 100 ? 2 : 0, maximumFractionDigits: 2 })}`;

type Row = { id: string; manage_token: string; fee_cents: number | null; client_note: string | null; clients: { id: string; name: string; email: string } | null };

async function load(id: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("appointments").select("id, manage_token, fee_cents, client_note, clients(id, name, email)").eq("id", id).maybeSingle();
  return data as unknown as Row | null;
}

export async function sendReviewSignPay(id: string, origin: string) {
  const a = await load(id); const c = a?.clients;
  if (!a || !c) return false;
  const portal = `${origin}/a/${a.manage_token}`;
  return sendMessage({
    dedupeKey: `closeout:${a.id}`, type: "review_sign_pay", minutesSaved: 8, clientId: c.id, appointmentId: a.id, to: c.email,
    subject: "Review, sign and pay", heading: "Your return is ready.",
    blocks: [
      { p: `Hi ${first(c.name)}, thanks for coming in. Claire has finished your return.${a.fee_cents ? ` The fee is ${money(a.fee_cents)}.` : ""}` },
      ...(a.client_note ? [{ p: `A note from Claire: ${a.client_note}` }] : []),
      { p: "One short step left: sign your e-file authorization (Form 8879) and pay. Your return is filed as soon as it's signed and paid." },
      { button: { label: "Review, sign and pay", href: portal } },
    ],
    sms: `Hartwell Tax: your return is ready. Sign and pay here: ${portal}`,
  });
}

export async function sendFixRequest(id: string, itemId: string, docName: string, reason: string, note: string | null, origin: string) {
  const a = await load(id); const c = a?.clients;
  if (!a || !c) return false;
  const portal = `${origin}/a/${a.manage_token}`;
  return sendMessage({
    dedupeKey: `fix:${itemId}:${Date.now()}`, type: "doc_fix_request", minutesSaved: 6, clientId: c.id, appointmentId: a.id, to: c.email,
    subject: `Please send your ${docName} again`, heading: "One document needs another look.",
    blocks: [
      { p: `Hi ${first(c.name)}, Claire looked at your ${docName}. Reason: ${reason}.` },
      ...(note ? [{ p: `Claire's note: ${note}` }] : []),
      { button: { label: "Replace the file", href: portal } },
      { note: "A clear phone photo is fine. Files go to private storage only Claire can see." },
    ],
  });
}

export async function sendPaymentReminder(id: string, origin: string, dedupeKey: string) {
  const a = await load(id); const c = a?.clients;
  if (!a || !c) return false;
  const portal = `${origin}/a/${a.manage_token}`;
  return sendMessage({
    dedupeKey, type: "payment_reminder", minutesSaved: 5, clientId: c.id, appointmentId: a.id, to: c.email,
    subject: "Your return is waiting to be filed", heading: "Almost filed.",
    blocks: [
      { p: `Hi ${first(c.name)}, your return is ready.${a.fee_cents ? ` Once the ${money(a.fee_cents)} fee is paid` : " Once it's paid"} and Form 8879 is signed, Claire files it the same day.` },
      { button: { label: "Sign and pay", href: portal } },
    ],
  });
}

export async function sendFiled(id: string) {
  const a = await load(id); const c = a?.clients;
  if (!a || !c) return false;
  return sendMessage({
    dedupeKey: `filed:${a.id}`, type: "return_filed", minutesSaved: 4, clientId: c.id, appointmentId: a.id, to: c.email,
    subject: "Your return has been e-filed", heading: "Your return has been e-filed.",
    blocks: [{ p: `Hi ${first(c.name)}, Claire has filed your return with the IRS. You'll hear from the IRS directly about any refund. Thank you for trusting us this year.` }],
  });
}
