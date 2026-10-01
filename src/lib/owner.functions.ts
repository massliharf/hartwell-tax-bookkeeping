import { OFFICE, OFFICE_ADDRESS, meetingLink } from "./meeting";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Ctx = { supabase: { rpc: (...a: never[]) => unknown }; userId: string };
async function assertOwner(context: unknown) {
  const c = context as Ctx & { supabase: import("@supabase/supabase-js").SupabaseClient };
  const { data } = await c.supabase.rpc("has_role", { _user_id: c.userId, _role: "admin" });
  if (!data) throw new Error("Forbidden");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/** Owners other than the public demo account. */
async function realOwnerCount(s: import("@supabase/supabase-js").SupabaseClient) {
  const { DEMO_EMAIL } = await import("./demo");
  const { data } = await s.from("user_roles").select("user_id").eq("role", "admin");
  let n = 0;
  for (const r of data ?? []) {
    const { data: u } = await s.auth.admin.getUserById(r.user_id);
    if (u.user?.email !== DEMO_EMAIL) n++;
  }
  return n;
}

/** Public: is an owner account set up yet? (Only reveals a boolean.) */
export const ownerSetupStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { count } = await supabaseAdmin.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "admin");
  return { hasOwner: (count ?? 0) > 0 };
});

/** One-time: creates Claire's account. Refuses once any owner exists. */
export const createOwnerAccount = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ email: z.string().trim().email().max(200), password: z.string().min(10).max(128) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "admin");
    if ((count ?? 0) > 0) return { ok: false, error: "An owner account already exists." };
    const { data: u, error } = await supabaseAdmin.auth.admin.createUser({ email: data.email, password: data.password, email_confirm: true });
    if (error || !u.user) return { ok: false, error: error?.message ?? "Could not create the account." };
    const { error: e2 } = await supabaseAdmin.from("user_roles").insert({ user_id: u.user.id, role: "admin" });
    if (e2) return { ok: false, error: "Could not finish setup." };
    return { ok: true, error: null };
  });

export const getOwnerContext = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    const { getNow } = await import("./clock.server");
    return { isOwner: !!data, now: (await getNow()).toISOString() };
  });

const idSchema = z.object({ id: z.string().uuid() });

export const markComplete = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => idSchema.parse(d))
  .handler(async ({ data, context }) => {
    const db = await assertOwner(context);
    await db.from("appointments").update({ status: "completed", signature_status: "pending", needs_attention: false, attention_reason: null }).eq("id", data.id);
    return { ok: true };
  });

export const markNoShow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => idSchema.parse(d))
  .handler(async ({ data, context }) => {
    const db = await assertOwner(context);
    await db.from("appointments").update({ status: "no_show", needs_attention: false, attention_reason: null }).eq("id", data.id);
    return { ok: true };
  });

/** Drag-to-move: same availability rules; the client gets a fresh confirmation email. */
export const ownerMoveAppointment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), start: z.string().datetime({ offset: true }) }).parse(d))
  .handler(async ({ data, context }) => {
    const db = await assertOwner(context);
    const { data: a } = await db.from("appointments").select("id, service_id, start_at").eq("id", data.id).maybeSingle();
    if (!a) return { ok: false as const, error: "Appointment not found." };
    const { getNow } = await import("./clock.server");
    const now = await getNow();
    const { data: res, error } = await db.rpc("reschedule_appointment", { _id: a.id, _start: new Date(data.start).toISOString(), _now: now.toISOString() });
    if (error) { console.error(error); return { ok: false as const, error: "Could not move it." }; }
    const r = res as { ok: boolean };
    if (!r.ok) return { ok: false as const, error: "That time isn't free." };
    await db.from("appointments").update({ needs_attention: false, attention_reason: null }).eq("id", a.id);
    const { sendBookingConfirmation, offerFreedSlot } = await import("./automations.server");
    const { requestOrigin } = await import("./origin.server");
    const origin = requestOrigin();
    await sendBookingConfirmation(a.id, origin).catch(console.error);
    await offerFreedSlot(a.service_id, a.start_at, origin).catch(console.error);
    return { ok: true as const, error: null };
  });

export const dismissAttention = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ kind: z.enum(["appointment", "message", "offer"]), id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const db = await assertOwner(context);
    if (data.kind === "appointment") await db.from("appointments").update({ needs_attention: false, attention_reason: "handled" }).eq("id", data.id);
    if (data.kind === "message") await db.from("messages").update({ delivery: "failed_seen" }).eq("id", data.id);
    if (data.kind === "offer") await db.from("waitlist_offers").update({ status: "claimed_seen" }).eq("id", data.id).eq("status", "claimed");
    return { ok: true };
  });

/** Sends an extra signature reminder now. */
export const nudgeSignature = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => idSchema.parse(d))
  .handler(async ({ data, context }) => {
    const db = await assertOwner(context);
    const { data: a } = await db.from("appointments").select("id, manage_token, signature_status, clients(id, name, email)").eq("id", data.id).maybeSingle();
    const c = a?.clients as { id: string; name: string; email: string } | null;
    if (!a || !c || a.signature_status !== "pending") return { ok: false };
    const { sendMessage } = await import("./email.server");
    const { requestOrigin } = await import("./origin.server");
    const portal = `${requestOrigin()}/a/${a.manage_token}`;
    const sent = await sendMessage({
      dedupeKey: `sign-manual:${a.id}:${Date.now()}`, type: "signature_reminder", minutesSaved: 6, clientId: c.id, appointmentId: a.id, to: c.email,
      subject: "One signature and you're filed", heading: "One signature and you're filed.",
      blocks: [{ p: `Hi ${c.name.split(" ")[0]}, your return is ready. Claire just needs your e-file authorization (Form 8879). It takes about a minute.` }, { button: { label: "Sign now", href: portal } }],
    });
    return { ok: sent };
  });

/** Finish appointment: final fee + note, then "Review, sign and pay" email. */
export const finishAppointment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), feeCents: z.number().int().min(0).max(10_000_000), note: z.string().trim().max(600).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const db = await assertOwner(context);
    const { getNow } = await import("./clock.server");
    const { error } = await db.from("appointments").update({
      status: "completed", signature_status: "pending", fee_cents: data.feeCents, client_note: data.note || null,
      finished_at: (await getNow()).toISOString(), needs_attention: false, attention_reason: null,
    }).eq("id", data.id).in("status", ["booked", "confirmed"]);
    if (error) return { ok: false };
    const { sendReviewSignPay } = await import("./closeout.server");
    const { requestOrigin } = await import("./origin.server");
    await sendReviewSignPay(data.id, requestOrigin()).catch(console.error);
    return { ok: true };
  });

export const reviewDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ itemId: z.string().uuid(), decision: z.enum(["accepted", "needs_fix"]), reason: z.string().max(60).optional(), note: z.string().trim().max(400).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const db = await assertOwner(context);
    const { data: item } = await db.from("checklist_items").select("id, document_name, appointment_id, status").eq("id", data.itemId).maybeSingle();
    if (!item || item.status !== "uploaded") return { ok: false };
    if (data.decision === "accepted") {
      await db.from("checklist_items").update({ review_status: "accepted", fix_reason: null, fix_note: null }).eq("id", item.id);
      return { ok: true };
    }
    const reason = data.reason || "Other";
    await db.from("checklist_items").update({ review_status: "needs_fix", fix_reason: reason, fix_note: data.note || null }).eq("id", item.id);
    const { sendFixRequest } = await import("./closeout.server");
    const { requestOrigin } = await import("./origin.server");
    await sendFixRequest(item.appointment_id, item.id, item.document_name, reason.toLowerCase(), data.note || null, requestOrigin()).catch(console.error);
    return { ok: true };
  });

export const markPaidInOffice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => idSchema.parse(d))
  .handler(async ({ data, context }) => {
    const db = await assertOwner(context);
    const { getNow } = await import("./clock.server");
    await db.from("appointments").update({ paid_at: (await getNow()).toISOString(), paid_method: "in_office" }).eq("id", data.id).eq("status", "completed").is("paid_at", null);
    return { ok: true };
  });

export const markFiled = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => idSchema.parse(d))
  .handler(async ({ data, context }) => {
    const db = await assertOwner(context);
    const { data: a } = await db.from("appointments").select("id, signature_status, paid_at, filed_at").eq("id", data.id).maybeSingle();
    if (!a || a.signature_status !== "signed" || !a.paid_at || a.filed_at) return { ok: false };
    const { getNow } = await import("./clock.server");
    await db.from("appointments").update({ filed_at: (await getNow()).toISOString() }).eq("id", a.id);
    const { sendFiled } = await import("./closeout.server");
    await sendFiled(a.id).catch(console.error);
    return { ok: true };
  });

export const remindPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => idSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertOwner(context);
    const { sendPaymentReminder } = await import("./closeout.server");
    const { requestOrigin } = await import("./origin.server");
    const ok = await sendPaymentReminder(data.id, requestOrigin(), `pay-manual:${data.id}:${Date.now()}`);
    return { ok };
  });

/** Phone-in: Claire books for a client. Same database booking as the public page (lock, re-check, checklist), then the same confirmation email. */
export const ownerBookAppointment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    serviceId: z.string().uuid(),
    start: z.string().datetime({ offset: true }),
    name: z.string().trim().min(1).max(120),
    email: z.string().trim().email().max(200),
    phone: z.string().trim().max(40).optional(),
    meetingType: z.enum(["in_person", "video"]),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const db = await assertOwner(context);
    const { getNow } = await import("./clock.server");
    const now = await getNow();
    const { data: res, error } = await db.rpc("book_appointment", {
      _service_id: data.serviceId, _start: new Date(data.start).toISOString(), _now: now.toISOString(),
      _name: data.name, _email: data.email, _phone: data.phone ?? "", _meeting_type: data.meetingType,
      _intake: { intake_pending: true } as never,
    });
    if (error) { console.error(error); return { ok: false as const, error: "Something went wrong. Try again." }; }
    const r = res as { ok: boolean; appointment_id?: string };
    if (!r.ok) return { ok: false as const, error: "That time was taken a moment ago. Pick another." };
    await db.from("leads").update({ converted: true }).eq("email", data.email.toLowerCase()).eq("converted", false);
    const { sendBookingConfirmation } = await import("./automations.server");
    const { requestOrigin } = await import("./origin.server");
    await sendBookingConfirmation(r.appointment_id!, requestOrigin()).catch(console.error);
    return { ok: true as const, appointmentId: r.appointment_id!, error: null };
  });

/* ---------- Manual follow-ups: every automatic message can also be sent by Claire on demand ---------- */
type FollowAppt = {
  id: string; manage_token: string; start_at: string; status: string; meeting_type: string; service_id: string; sort_max?: number;
  clients: { id: string; name: string; email: string } | null; services: { name: string; slug: string } | null;
  checklist_items: { document_name: string; status: string; required: boolean; sort_order: number }[];
};
async function followAppt(context: unknown, id: string) {
  const db = await assertOwner(context);
  const { data } = await db.from("appointments")
    .select("id, manage_token, start_at, status, meeting_type, service_id, clients(id, name, email), services(name, slug), checklist_items(document_name, status, required, sort_order)")
    .eq("id", id).maybeSingle();
  const a = data as unknown as FollowAppt | null;
  const { requestOrigin } = await import("./origin.server");
  const { sendMessage } = await import("./email.server");
  const { getNow } = await import("./clock.server");
  return { db, a, c: a?.clients ?? null, origin: requestOrigin(), sendMessage, now: await getNow() };
}
const tz = { timeZone: "America/New_York" } as const;
const when = (iso: string) => `${new Date(iso).toLocaleDateString("en-US", { ...tz, weekday: "long", month: "long", day: "numeric" })} at ${new Date(iso).toLocaleTimeString("en-US", { ...tz, hour: "numeric", minute: "2-digit" })}`;
const firstName = (n: string) => n.split(" ")[0] ?? n;
/** One manual send per hour per kind, so a double click never sends twice. */
const hourKey = (kind: string, id: string, now: Date) => `${kind}-manual:${id}:${now.toISOString().slice(0, 13)}`;

export const sendDocsReminder = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((d) => idSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { a, c, origin, sendMessage, now } = await followAppt(context, data.id);
    if (!a || !c || !["booked", "confirmed"].includes(a.status)) return { ok: false, message: "This appointment isn't open." };
    const missing = a.checklist_items.filter((i) => i.required && i.status === "missing").map((i) => i.document_name);
    if (!missing.length) return { ok: false, message: "Nothing is missing." };
    const ok = await sendMessage({
      dedupeKey: hourKey("docs", a.id, now), type: "docs_reminder_7d", minutesSaved: 6, clientId: c.id, appointmentId: a.id, to: c.email,
      subject: `${missing.length} document${missing.length === 1 ? "" : "s"} left for ${new Date(a.start_at).toLocaleDateString("en-US", { ...tz, weekday: "long" })}`,
      heading: "A few documents to go.",
      blocks: [{ p: `Hi ${firstName(c.name)}, a quick note from Claire before your appointment on ${when(a.start_at)}. Still needed:` }, { list: missing }, { button: { label: "Upload from your phone", href: `${origin}/a/${a.manage_token}` } }],
    });
    return { ok, message: ok ? `Document reminder sent to ${firstName(c.name)}.` : "Already sent in the last hour." };
  });

export const sendApptReminder = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((d) => idSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { db, a, c, origin, sendMessage, now } = await followAppt(context, data.id);
    if (!a || !c || !["booked", "confirmed"].includes(a.status)) return { ok: false, message: "This appointment isn't open." };
    const { data: st } = await db.from("settings").select("video_link").eq("id", 1).maybeSingle();
    const place = a.meeting_type === "video" ? `Video call: ${meetingLink(st?.video_link, a.id)}` : `In person at ${OFFICE_ADDRESS}. ${OFFICE.parking}`;
    const ok = await sendMessage({
      dedupeKey: hourKey("remind", a.id, now), type: "final_reminder_24h", minutesSaved: 4, clientId: c.id, appointmentId: a.id, to: c.email,
      subject: `Reminder: ${a.services?.name ?? "your appointment"}, ${when(a.start_at)}`, heading: "See you soon.",
      blocks: [{ p: `Hi ${firstName(c.name)}, this is a reminder of your appointment with Claire on ${when(a.start_at)}.` }, { p: place }, { button: { label: "Confirm, move or cancel", href: `${origin}/a/${a.manage_token}` } }],
      sms: `Hartwell Tax: reminder, ${when(a.start_at)}. Manage: ${origin}/a/${a.manage_token}`,
    });
    return { ok, message: ok ? `Reminder sent to ${firstName(c.name)}.` : "Already sent in the last hour." };
  });

export const requestExtraDocument = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), name: z.string().trim().min(2).max(80), note: z.string().trim().max(300).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const { db, a, c, origin, sendMessage, now } = await followAppt(context, data.id);
    if (!a || !c || ["cancelled", "no_show"].includes(a.status) ) return { ok: false, message: "This appointment is closed." };
    if (a.checklist_items.some((i) => i.document_name.toLowerCase() === data.name.toLowerCase())) return { ok: false, message: "That document is already on the list." };
    const sort = Math.max(0, ...a.checklist_items.map((i) => i.sort_order)) + 1;
    const { error } = await db.from("checklist_items").insert({ appointment_id: a.id, document_name: data.name, description: data.note || null, required: true, status: "missing", sort_order: sort });
    if (error) return { ok: false, message: "Couldn't add it. Try again." };
    await db.rpc("compute_ready_score", { _id: a.id });
    await sendMessage({
      dedupeKey: `extra:${a.id}:${data.name.toLowerCase()}:${now.toISOString().slice(0, 13)}`, type: "doc_fix_request", minutesSaved: 6, clientId: c.id, appointmentId: a.id, to: c.email,
      subject: `Claire needs one more document: ${data.name}`, heading: "One more document, please.",
      blocks: [{ p: `Hi ${firstName(c.name)}, after looking through your documents Claire needs one more: ${data.name}.` }, ...(data.note ? [{ p: `Claire's note: ${data.note}` }] : []), { button: { label: "Upload it", href: `${origin}/a/${a.manage_token}` } }],
    });
    return { ok: true, message: `Added "${data.name}" and emailed ${firstName(c.name)}.` };
  });

export const resendPortalLink = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((d) => idSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { a, c, origin, sendMessage, now } = await followAppt(context, data.id);
    if (!a || !c) return { ok: false, message: "Not found." };
    const ok = await sendMessage({
      dedupeKey: hourKey("link", a.id, now), type: "booking_confirmation", minutesSaved: 3, clientId: c.id, appointmentId: a.id, to: c.email,
      subject: "Your Hartwell Tax appointment link", heading: "Here's your private link.",
      blocks: [{ p: `Hi ${firstName(c.name)}, here is the link to your appointment (${a.services?.name ?? "appointment"}, ${when(a.start_at)}). Upload documents, confirm, move or cancel from there.` }, { button: { label: "Open my appointment", href: `${origin}/a/${a.manage_token}` } }],
    });
    return { ok, message: ok ? `Link sent to ${firstName(c.name)}.` : "Already sent in the last hour." };
  });

export const ownerCancelAppointment = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), note: z.string().trim().max(300).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const { db, a, c, origin, sendMessage, now } = await followAppt(context, data.id);
    if (!a || !c || !["booked", "confirmed"].includes(a.status)) return { ok: false, message: "This appointment isn't open." };
    await db.from("appointments").update({ status: "cancelled", needs_attention: false, attention_reason: null }).eq("id", a.id);
    await sendMessage({
      dedupeKey: `owner-cancel:${a.id}`, type: "reschedule_offer", minutesSaved: 5, clientId: c.id, appointmentId: a.id, to: c.email,
      subject: "Your appointment was cancelled", heading: "We need to find you a new time.",
      blocks: [{ p: `Hi ${firstName(c.name)}, Claire had to cancel your appointment on ${when(a.start_at)}.` }, ...(data.note ? [{ p: `Claire's note: ${data.note}` }] : []), { p: "Your documents and answers are saved. Pick any open time and you're booked again." }, { button: { label: "Pick a new time", href: `${origin}/book?service=${a.services?.slug ?? ""}` } }],
    });
    const { offerFreedSlot } = await import("./automations.server");
    if (new Date(a.start_at) > now) await offerFreedSlot(a.service_id, a.start_at, origin).catch(console.error);
    return { ok: true, message: `Cancelled. ${firstName(c.name)} was emailed a link to rebook, and the waitlist was offered the slot.` };
  });

export const sendRebookLink = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((d) => idSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { a, c, origin, sendMessage, now } = await followAppt(context, data.id);
    if (!a || !c) return { ok: false, message: "Not found." };
    const ok = await sendMessage({
      dedupeKey: hourKey("rebook", a.id, now), type: "reschedule_offer", minutesSaved: 5, clientId: c.id, appointmentId: a.id, to: c.email,
      subject: "Let's find you a new time", heading: "We missed you.",
      blocks: [{ p: `Hi ${firstName(c.name)}, we missed you on ${when(a.start_at)}. Your documents are saved, so booking again takes a minute.` }, { button: { label: "Pick a new time", href: `${origin}/book?service=${a.services?.slug ?? ""}` } }],
    });
    return { ok, message: ok ? `Rebooking link sent to ${firstName(c.name)}.` : "Already sent in the last hour." };
  });

/** The meeting ran out of time: book the next one on the same appointment (documents and answers carry over) and tell the client. */
export const bookFollowUpMeeting = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), start: z.string().datetime({ offset: true }), note: z.string().trim().max(300).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const { db, a, c, origin, sendMessage, now } = await followAppt(context, data.id);
    if (!a || !c || !["booked", "confirmed"].includes(a.status)) return { ok: false, message: "This appointment is already closed." };
    const previous = a.start_at;
    const { data: res, error } = await db.rpc("reschedule_appointment", { _id: a.id, _start: new Date(data.start).toISOString(), _now: now.toISOString() });
    if (error || !(res as { ok: boolean } | null)?.ok) return { ok: false, message: "That time isn't free. Pick another." };
    await db.from("appointments").update({ status: "booked", needs_attention: false, attention_reason: null }).eq("id", a.id);
    await sendMessage({
      dedupeKey: `followup:${a.id}:${data.start}`, type: "booking_confirmation", minutesSaved: 5, clientId: c.id, appointmentId: a.id, to: c.email,
      subject: `Your follow-up with Claire: ${when(data.start)}`, heading: "Let's finish at your next meeting.",
      blocks: [
        { p: `Hi ${firstName(c.name)}, thanks for meeting on ${when(previous)}. Claire has booked a follow-up to finish your return: ${when(data.start)}.` },
        ...(data.note ? [{ p: `Claire's note: ${data.note}` }] : []),
        { p: "Your documents and answers carry over. If Claire asked for anything else, it's on your checklist." },
        { button: { label: "Open your appointment", href: `${origin}/a/${a.manage_token}` } },
      ],
      sms: `Hartwell Tax: follow-up booked for ${when(data.start)}. ${origin}/a/${a.manage_token}`,
    });
    return { ok: true, message: `Follow-up booked for ${when(data.start)}. ${firstName(c.name)} has been emailed.` };
  });

/** The free intro call is over: close it without a fee, signature or filing, and send the client a link to schedule. */
export const completeIntroCall = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((d) => idSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { db, a, c, origin, sendMessage, now } = await followAppt(context, data.id);
    if (!a || !c || !["booked", "confirmed"].includes(a.status)) return { ok: false };
    const { error } = await db.from("appointments").update({ status: "completed", finished_at: now.toISOString(), fee_cents: null, needs_attention: false, attention_reason: null }).eq("id", a.id);
    if (error) return { ok: false };
    await sendMessage({
      dedupeKey: `intro-done:${a.id}`, type: "new_season", minutesSaved: 4, clientId: c.id, appointmentId: a.id, to: c.email,
      subject: "Thanks for talking with Claire", heading: "Ready for the next step?",
      blocks: [
        { p: `Hi ${firstName(c.name)}, thanks for the call. When you're ready, schedule the appointment Claire suggested. It takes about two minutes, and you'll get a list of exactly what to bring.` },
        { button: { label: "Schedule your appointment", href: `${origin}/book` } },
      ],
      sms: `Hartwell Tax: thanks for the call. Schedule your appointment here: ${origin}/book`,
    });
    return { ok: true };
  });
