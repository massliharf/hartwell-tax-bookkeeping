import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { DEMO_EMAIL, DEMO_PASSWORD } from "./demo";
import type { Block } from "./email.server";

async function owner(context: { supabase: import("@supabase/supabase-js").SupabaseClient; userId: string }) {
  const { data } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (!data) throw new Error("Forbidden");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { requestOrigin } = await import("./origin.server");
  const { getNow } = await import("./clock.server");
  return { s: supabaseAdmin, origin: await requestOrigin(), getNow };
}

/** Public: makes sure the demo owner account exists with the published password. Touches only that account. */
export const ensureDemoAccount = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin: s } = await import("@/integrations/supabase/client.server");
  const { data: list } = await s.auth.admin.listUsers({ perPage: 200 });
  let u = list?.users.find((x) => x.email === DEMO_EMAIL);
  if (!u) {
    const { data } = await s.auth.admin.createUser({ email: DEMO_EMAIL, password: DEMO_PASSWORD, email_confirm: true });
    u = data.user ?? undefined;
  } else {
    await s.auth.admin.updateUserById(u.id, { password: DEMO_PASSWORD });
  }
  if (!u) return { ok: false };
  await s.from("user_roles").upsert({ user_id: u.id, role: "admin" }, { onConflict: "user_id,role", ignoreDuplicates: true });
  return { ok: true };
});

/** Owner: messages sent to one recipient (phone preview). */
export const phoneFeed = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { s } = await owner(context);
    const { data } = await s.from("messages").select("id, channel, type, subject, body, sent_at, recipient, clients(name)")
      .not("recipient", "is", null).order("sent_at", { ascending: false }).limit(300);
    return (data ?? []).map((m) => ({ ...m, name: (m.clients as { name: string } | null)?.name ?? null }));
  });

export const demoRun = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { origin } = await owner(context);
  const { runAutomations } = await import("./automations.server");
  const r = await runAutomations(origin);
  const n = Object.values(r.sent as Record<string, number>).reduce((a, b) => a + b, 0);
  return { message: n ? `Sent ${n} message${n === 1 ? "" : "s"}.` : "Nothing was due." };
});

export const demoJump = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ days: z.union([z.literal(1), z.literal(2), z.literal(7)]) }).parse(d))
  .handler(async ({ data, context }) => {
    const { s } = await owner(context);
    const { data: st } = await s.from("settings").select("demo_time_offset_minutes").eq("id", 1).single();
    await s.from("settings").update({ demo_time_offset_minutes: (st?.demo_time_offset_minutes ?? 0) + data.days * 1440 }).eq("id", 1);
    const { runAutomations } = await import("./automations.server");
    const r = await runAutomations(origin);
    const n = Object.values(r.sent as Record<string, number>).reduce((a, b) => a + b, 0);
    return { message: `Jumped ${data.days} day${data.days > 1 ? "s" : ""} ahead. ${n} message${n === 1 ? "" : "s"} went out.` };
  });

const SAMPLE_FILES: [RegExp, string][] = [
  [/photo id/i, "photo-id"], [/last year|prior year/i, "last-year"], [/w-2/i, "w-2"], [/1099-nec|1099-k/i, "1099-nec"],
  [/income & expense/i, "income-expense"], [/home office/i, "home-office"], [/1099-int/i, "1099-int"], [/1099-b/i, "1099-b"],
  [/1098-e/i, "1098-e"], [/1098/i, "1098"], [/childcare/i, "childcare"], [/rental/i, "rental"], [/property tax/i, "property-tax"], [/irs letter/i, "irs-letter"],
];

/** Simulates a client upload with a realistic sample image (stored privately like a real upload). */
async function simulateUpload(context: Parameters<typeof owner>[0], opts: { wrongYear: boolean }) {
  const { s, getNow, origin } = await owner(context);
  const now = (await getNow()).toISOString();
  let q = s.from("checklist_items")
    .select("id, document_name, appointment_id, appointments!inner(start_at, status, clients(name))")
    .eq("status", "missing").eq("required", true).in("appointments.status", ["booked", "confirmed"])
    .gt("appointments.start_at", now);
  if (opts.wrongYear) q = q.ilike("document_name", "%W-2%");
  const { data: items } = await q.order("start_at", { referencedTable: "appointments" }).limit(1);
  const it = items?.[0];
  if (!it) return { message: opts.wrongYear ? "No missing W-2 left to simulate." : "No missing documents left to upload." };
  const slug = SAMPLE_FILES.find(([re]) => re.test(it.document_name))?.[1] ?? "generic";
  const path = `${it.appointment_id}/${it.id}-demo.jpg`;
  const img = await fetch(`${origin}/demo-docs/${slug}.jpg`).then((r) => (r.ok ? r.blob() : null)).catch(() => null);
  if (img) await s.storage.from("client-documents").upload(path, img, { upsert: true, contentType: "image/jpeg" });
  await s.from("checklist_items").update({
    status: "uploaded", file_path: img ? path : null, uploaded_at: now, review_status: opts.wrongYear ? "pending" : "accepted", fix_reason: null, fix_note: null,
    ai_check: opts.wrongYear ? "kept" : "ok",
    ai_note: opts.wrongYear ? "This looks like a 2024 W-2. We need the 2025 one." : `Looks like the right ${it.document_name} for this client.`,
  }).eq("id", it.id);
  await s.rpc("compute_ready_score", { _id: it.appointment_id });
  const name = (it.appointments as unknown as { clients: { name: string } | null }).clients?.name ?? "A client";
  return { message: opts.wrongYear ? `${name} uploaded last year's W-2 and kept it after the warning. It's the one document that needs your eyes.` : `${name} uploaded "${it.document_name}". The AI checked it and accepted it. Nothing for you to do.` };
}

export const demoUpload = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => simulateUpload(context, { wrongYear: false }));
export const demoWrongDoc = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => simulateUpload(context, { wrongYear: true }));

/** A finished, unpaid return: the client signs Form 8879 and pays, so it lands in Ready to file. */
export const demoClientPays = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { s, getNow } = await owner(context);
  const now = (await getNow()).toISOString();
  const { data: a } = await s.from("appointments").select("id, fee_cents, clients(name)")
    .eq("status", "completed").is("paid_at", null).is("filed_at", null).not("fee_cents", "is", null)
    .order("finished_at", { ascending: false }).limit(1).maybeSingle();
  if (!a) return { message: "No finished return is waiting for payment. Finish an appointment first." };
  await s.from("appointments").update({ signature_status: "signed", signed_at: now, paid_at: now, paid_method: "test" }).eq("id", a.id);
  const name = (a.clients as { name: string } | null)?.name ?? "The client";
  return { message: `${name} signed Form 8879 and paid $${Math.round((a.fee_cents ?? 0) / 100)}. It's in Ready to file.` };
});

/** Opens the client's private page for the next upcoming appointment (for showing the client side). */
export const demoPortalLink = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { s, getNow } = await owner(context);
  const now = (await getNow()).toISOString();
  const { data: a } = await s.from("appointments").select("manage_token").in("status", ["booked", "confirmed"]).gt("start_at", now).order("start_at").limit(1).maybeSingle();
  return { token: a?.manage_token ?? null };
});

export const demoCancelTomorrow = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { s, origin, getNow } = await owner(context);
  const now = await getNow();
  const from = new Date(now.getTime() + 18 * 3600e3).toISOString();
  const to = new Date(now.getTime() + 48 * 3600e3).toISOString();
  const { data: a } = await s.from("appointments").select("id, service_id, start_at, clients(name)")
    .in("status", ["booked", "confirmed"]).gte("start_at", from).lte("start_at", to).order("start_at").limit(1).maybeSingle();
  if (!a) return { message: "No appointment tomorrow to cancel." };
  // Make sure someone is waiting for this service so the freed slot is offered.
  const { count } = await s.from("waitlist").select("id", { count: "exact", head: true }).eq("service_id", a.service_id).in("status", ["waiting", "offered"]);
  if (!count) {
    const { data: c } = await s.from("waitlist").select("client_id").limit(1).maybeSingle();
    if (c) await s.from("waitlist").insert({ client_id: c.client_id, service_id: a.service_id, preferred_days: [] });
  }
  await s.from("appointments").update({ status: "cancelled" }).eq("id", a.id);
  const { offerFreedSlot } = await import("./automations.server");
  await offerFreedSlot(a.service_id, a.start_at, origin);
  const name = (a.clients as { name: string } | null)?.name ?? "A client";
  return { message: `${name} cancelled. The slot was offered to the waitlist.` };
});

export const demoClaim = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { s, origin } = await owner(context);
  const { data: o } = await s.from("waitlist_offers").select("token, waitlist(clients(name))").eq("status", "open")
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!o) return { message: "No open waitlist offer. Try “client cancels” first." };
  const { claimOfferByToken } = await import("./automations.server");
  const r = await claimOfferByToken(o.token, origin);
  const name = (o.waitlist as { clients: { name: string } | null } | null)?.clients?.name ?? "A client";
  return { message: r.ok ? `${name} claimed the slot and is booked.` : "Someone else got there first." };
});

export const demoAbandon = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { s, origin, getNow } = await owner(context);
  const now = await getNow();
  const stamp = Math.floor(now.getTime() / 1000).toString(36);
  const email = `maya.shah+${stamp}@example.com`;
  await s.from("leads").insert({
    email, name: "Maya Shah", last_step: "time",
    partial_booking: { step: 2, serviceSlug: "individual" },
    created_at: new Date(now.getTime() - 2 * 3600e3).toISOString(),
  });
  const { runAutomations } = await import("./automations.server");
  await runAutomations(origin);
  return { message: "Maya Shah left mid-booking. She got a nudge to finish." };
});

export const demoReset = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { s } = await owner(context);
  const { error } = await s.rpc("demo_restore");
  if (error) throw new Error("Could not reset demo data.");
  return { message: "Demo data reset. The clock is back to today." };
});

/**
 * Demo: the no-show the readiness check prevents. A client two days out is still missing documents;
 * they're offered later times (the same email the 48-hour check sends) and take one. Claire does nothing.
 */
export const demoPreventNoShow = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { s, origin, getNow } = await owner(context);
  const now = await getNow();
  const { data: list } = await s.from("appointments").select("id, service_id, start_at, ready_score, manage_token, clients(id, name, email)")
    .in("status", ["booked", "confirmed"]).gte("start_at", new Date(now.getTime() + 2 * 3600e3).toISOString()).lte("start_at", new Date(now.getTime() + 4 * 86400e3).toISOString())
    .lt("ready_score", 100).order("ready_score").limit(1);
  const a = list?.[0] as { id: string; service_id: string; start_at: string; ready_score: number; manage_token: string; clients: { id: string; name: string; email: string } | null } | undefined;
  if (!a || !a.clients) return { message: "No upcoming appointment is missing documents right now. Try 'Client uploads last year's W-2' first, or reset the demo." };
  const { data: slots } = await s.rpc("available_slots", { _service_id: a.service_id, _from: a.start_at.slice(0, 10), _to: new Date(Date.parse(a.start_at) + 21 * 86400e3).toISOString().slice(0, 10), _now: now.toISOString() });
  const later = ((slots ?? []) as string[]).filter((x) => Date.parse(x) > Date.parse(a.start_at) + 86400e3 && new Date(x).getUTCMinutes() % 30 === 0);
  const to = later[0];
  if (!to) return { message: "No later time is open for this service. Add hours in Settings, or reset the demo." };
  const tz = { timeZone: "America/New_York" } as const;
  const when = (iso: string) => `${new Date(iso).toLocaleDateString("en-US", { ...tz, weekday: "long", month: "long", day: "numeric" })} at ${new Date(iso).toLocaleTimeString("en-US", { ...tz, hour: "numeric", minute: "2-digit" })}`;
  const first = a.clients.name.split(" ")[0];
  const { sendMessage } = await import("./email.server");
  // The offer goes out as if the 48-hour check had just run (sent well before the appointment).
  await sendMessage({
    dedupeKey: `ready48:${a.id}:${a.start_at}`, type: "reschedule_offer", minutesSaved: 10, clientId: a.clients.id, appointmentId: a.id, to: a.clients.email,
    subject: "Want to move your appointment so it's not wasted?", heading: "Want a little more time?",
    blocks: [
      { p: `Hi ${first}, your appointment is ${when(a.start_at)}, and a few documents are still missing. If you'd like more time to gather them, you can move to a later slot with one tap.` },
      { buttons: later.slice(0, 3).map((x) => ({ label: when(x), href: `${origin}/move/${a.manage_token}?to=${encodeURIComponent(x)}` })) },
      { button: { label: "Keep my time and upload now", href: `${origin}/a/${a.manage_token}` } },
      { note: "Either way is completely fine. We just want your visit to count." },
    ],
  });
  const { data: res } = await s.rpc("reschedule_appointment", { _id: a.id, _start: to, _now: now.toISOString() });
  if (!(res as { ok: boolean } | null)?.ok) return { message: `${first} was offered a later time, but it was just taken. Run it again.` };
  await s.from("appointments").update({ needs_attention: false, attention_reason: "handled" }).eq("id", a.id);
  return { message: `${first} was ${a.ready_score}% ready two days out, got offered later times, and moved to ${when(to)}. An empty chair avoided, without you.` };
});

/**
 * Demo: fill the next week (and the last few days) with sample clients in every state, so the panel and
 * the calendar look like a real busy week: missing documents, a document that needs Claire's eyes, ready,
 * a free call, a meeting happening now, one that just ended, waiting for signature, waiting for payment,
 * ready to file, filed, a no-show, a cancellation, a fully booked day with a waitlist, and open gaps.
 * Sample clients use @example.com addresses; nothing is emailed. "Reset demo data" removes them.
 */
export const demoFillWeek = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { s, getNow } = await owner(context);
  const now = await getNow();
  const H = 3600e3, D = 86400e3;
  const tz = "America/New_York";
  const ymd = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  const offset = (d: Date) => { const p = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "shortOffset" }).formatToParts(d).find((x) => x.type === "timeZoneName")?.value ?? "GMT-4"; const m = p.match(/GMT([+-]\d+)/); const h = m ? Number(m[1]) : -4; return `${h < 0 ? "-" : "+"}${String(Math.abs(h)).padStart(2, "0")}:00`; };
  const at = (dayOffset: number, hh: number, mm = 0) => { const d = new Date(now.getTime() + dayOffset * D); return new Date(`${ymd(d)}T${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:00${offset(d)}`); };

  const { data: svcs } = await s.from("services").select("id, slug, duration_min, price_from").eq("active", true);
  const svc = new Map((svcs ?? []).map((x) => [x.slug, x]));
  const S = (slug: string) => svc.get(slug) ?? svc.get("individual")!;
  if (!svc.size) return { message: "No services found." };

  const people = ["Priya Nair", "Marcus Lee", "Elena Rossi", "Tom Becker", "Dana Whitfield", "Sam Carter", "Olivia Grant", "Raj Patel", "Hannah Kim", "Luis Ortega", "Grace O'Neill", "Ben Walsh", "Maya Cohen", "Chris Young", "Nora Kim", "Eli Brooks", "Jordan Price", "Aisha Bello"];
  const clientId = new Map<string, string>();
  for (const [i, name] of people.entries()) {
    const email = `${name.toLowerCase().replace(/[^a-z]+/g, ".")}@example.com`;
    const { data: found } = await s.from("clients").select("id").eq("email", email).maybeSingle();
    if (found) { clientId.set(name, found.id); continue; }
    const { data: made } = await s.from("clients").insert({ name, email, phone: `(973) 555-01${String(20 + i).padStart(2, "0")}`, is_returning: i % 3 !== 0 }).select("id").single();
    if (made) clientId.set(name, made.id);
  }

  // The next free start for a service on a given day, using the same availability clients see.
  const freeSlot = async (slug: string, dayOffset: number, pick: "first" | "last" | number = "first") => {
    const day = ymd(new Date(now.getTime() + dayOffset * D));
    const { data } = await s.rpc("available_slots", { _service_id: S(slug).id, _from: day, _to: day, _now: now.toISOString() });
    const list = ((data ?? []) as string[]).filter((x) => new Date(x).getUTCMinutes() % 30 === 0);
    if (!list.length) return null;
    const i = pick === "first" ? 0 : pick === "last" ? list.length - 1 : Math.min(pick, list.length - 1);
    return new Date(list[i]!);
  };

  type Docs = "none" | "some" | "all" | "flag";
  let made = 0;
  const add = async (name: string, slug: string, start: Date | null, o: { status?: "booked" | "confirmed" | "completed" | "cancelled" | "no_show"; docs?: Docs; video?: boolean; fee?: number; finishedH?: number; signed?: boolean; paid?: boolean; filedH?: number; attention?: string } = {}) => {
    if (!start || !clientId.get(name)) return;
    const sv = S(slug);
    const end = new Date(start.getTime() + sv.duration_min * 60e3);
    const intake = { w2_employers: ["Employer 1"], interest: true, mortgage: slug === "individual", dependents: name.length % 2 === 0, filed_with_us: o.docs !== "none" };
    const { data: a, error } = await s.from("appointments").insert({
      client_id: clientId.get(name)!, service_id: sv.id, start_at: start.toISOString(), end_at: end.toISOString(), status: o.status ?? "booked",
      meeting_type: o.video ? "video" : "in_person", intake_answers: intake,
      fee_cents: o.fee ?? null, finished_at: o.finishedH != null ? new Date(now.getTime() - o.finishedH * H).toISOString() : null,
      signature_status: o.signed ? "signed" : o.fee ? "pending" : "not_needed", signed_at: o.signed ? new Date(now.getTime() - (o.finishedH ?? 24) * H + 4 * H).toISOString() : null, signed_name: o.signed ? name : null,
      paid_at: o.paid ? new Date(now.getTime() - (o.finishedH ?? 24) * H + 6 * H).toISOString() : null, paid_method: o.paid ? "card" : null,
      filed_at: o.filedH != null ? new Date(now.getTime() - o.filedH * H).toISOString() : null,
      needs_attention: !!o.attention, attention_reason: o.attention ?? null,
      created_at: new Date(start.getTime() - 9 * D).toISOString(),
    }).select("id").single();
    if (error || !a) return;
    made++;
    await s.rpc("generate_checklist", { _appointment_id: a.id });
    const { data: items } = await s.from("checklist_items").select("id, document_name").eq("appointment_id", a.id).order("sort_order");
    const all = items ?? [];
    const upTo = o.docs === "all" ? all.length : o.docs === "some" ? Math.ceil(all.length / 2) : o.docs === "flag" ? all.length : 0;
    for (const [i, it] of all.slice(0, upTo).entries()) {
      const flag = o.docs === "flag" && i === all.length - 1;
      await s.from("checklist_items").update({ status: "uploaded", uploaded_at: new Date(now.getTime() - (i + 1) * 5 * H).toISOString(), review_status: flag ? "pending" : "accepted", ai_check: flag ? "kept" : "ok",
        ai_note: flag ? "This looks like last year's form. We need this year's." : `Looks like the right ${it.document_name}.` }).eq("id", it.id);
    }
    await s.rpc("compute_ready_score", { _id: a.id });
    // What went out on its own for this client (no real emails are sent for sample clients).
    const msgs: { type: "booking_confirmation" | "docs_reminder_7d" | "final_reminder_24h" | "review_sign_pay" | "return_filed"; minutes: number; at: number }[] = [{ type: "booking_confirmation", minutes: 3, at: start.getTime() - 9 * D }];
    if (o.docs === "some" || o.docs === "none") msgs.push({ type: "docs_reminder_7d", minutes: 6, at: Math.min(now.getTime() - H, start.getTime() - 7 * D) });
    if (start.getTime() < now.getTime()) msgs.push({ type: "final_reminder_24h", minutes: 4, at: start.getTime() - D });
    if (o.fee) msgs.push({ type: "review_sign_pay", minutes: 8, at: now.getTime() - (o.finishedH ?? 24) * H });
    if (o.filedH != null) msgs.push({ type: "return_filed", minutes: 3, at: now.getTime() - o.filedH * H });
    await s.from("messages").insert(msgs.filter((m) => m.at <= now.getTime()).map((m) => ({ type: m.type, channel: "email" as const, subject: "Sample message", body: "Sample message for the demo.", recipient: null, client_id: clientId.get(name)!, appointment_id: a.id, sent_at: new Date(m.at).toISOString(), minutes_saved: m.minutes, dedupe_key: `sample:${a.id}:${m.type}` })));
  };

  // Coming up: every pre-appointment state, plus a free call and a letter review.
  await add("Priya Nair", "individual", await freeSlot("individual", 1, 0), { docs: "none" });
  await add("Marcus Lee", "self-employed", await freeSlot("self-employed", 1, 2), { docs: "some", status: "confirmed" });
  await add("Elena Rossi", "individual", await freeSlot("individual", 1, "last"), { docs: "all", status: "confirmed", video: true });
  await add("Tom Becker", "intro", await freeSlot("intro", 2, 1), { video: true });
  await add("Dana Whitfield", "rental", await freeSlot("rental", 2, 3), { docs: "flag" });
  await add("Raj Patel", "letter", await freeSlot("letter", 4, 0), { docs: "some", video: true });
  await add("Hannah Kim", "planning", await freeSlot("planning", 5, 2), { docs: "all", status: "confirmed", video: true });
  // One fully booked day, so the calendar shows "Full" and the waitlist has a reason to exist.
  const fullDay = 3;
  for (const name of ["Luis Ortega", "Grace O'Neill", "Jordan Price", "Aisha Bello", "Nora Kim", "Eli Brooks", "Chris Young", "Maya Cohen"]) {
    await add(name, "individual", await freeSlot("individual", fullDay, "first"), { docs: made % 3 === 0 ? "all" : "some", status: made % 2 ? "confirmed" : "booked" });
  }
  const lucas = clientId.get("Sam Carter");
  if (lucas) await s.from("waitlist").insert({ client_id: lucas, service_id: S("individual").id, preferred_days: [] });

  // Today: one happening now and one that just ended (Claire's turn).
  const nowSlot = new Date(Math.floor((now.getTime() - 10 * 60e3) / (5 * 60e3)) * 5 * 60e3);
  await add("Ben Walsh", "individual", nowSlot, { docs: "all", status: "confirmed" });
  await add("Olivia Grant", "self-employed", new Date(now.getTime() - 2.5 * H), { docs: "all", status: "confirmed" });

  // After the meeting: waiting for signature, waiting for payment, ready to file, filed, a no-show, a cancellation.
  await add("Sam Carter", "individual", at(-1, 10), { status: "completed", docs: "all", fee: 25000, finishedH: 20 });
  await add("Grace O'Neill", "rental", at(-2, 14), { status: "completed", docs: "all", fee: 40000, finishedH: 44, signed: true });
  await add("Jordan Price", "self-employed", at(-3, 11), { status: "completed", docs: "all", fee: 45000, finishedH: 68, signed: true, paid: true });
  await add("Aisha Bello", "individual", at(-5, 9, 30), { status: "completed", docs: "all", fee: 25000, finishedH: 116, signed: true, paid: true, filedH: 90 });
  await add("Chris Young", "individual", at(-2, 16), { status: "no_show", docs: "some" });
  await add("Maya Cohen", "extension", await freeSlot("extension", 1, 4), { status: "cancelled", docs: "none" });

  return { message: `Added ${made} sample appointments across this week: every state, a full day with a waitlist, and open gaps. Reset demo data to remove them.` };
});

/** Owner: send a real copy of one demo message to an address you own, to see it in a real inbox. */
export const demoSendCopy = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), to: z.string().email().max(200) }).parse(d))
  .handler(async ({ data, context }) => {
    const to = data.to.trim();
    const { s, origin } = await owner(context);
    const key = process.env["RESEND_API_KEY"];
    if (!key) return { ok: false as const, reason: "no_key" as const };
    const { data: m } = await s.from("messages").select("subject, body, recipient").eq("id", data.id).eq("channel", "email").maybeSingle();
    if (!m || !/@example\.(com|org|net)$/i.test(m.recipient ?? "")) return { ok: false as const, reason: "missing" as const };
    const { renderEmail, toText } = await import("./email.server");
    const parts = m.body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
    parts.shift(); // The stored plain-text message starts with its heading.
    if (parts.at(-1) === "Claire Hartwell, EA") parts.pop();
    const blocks = parts.flatMap((part): Block[] => {
      const lines = part.split("\n");
      if (lines.every((line) => line.startsWith("- "))) return [{ list: lines.map((line) => line.slice(2)) }];
      const links = lines.map((line) => line.match(/^(.+?): (https:\/\/\S+)$/));
      if (links.every((link) => link !== null)) return links.map((link) => ({ button: { label: link?.[1] ?? "Open appointment", href: link?.[2] ?? "" } }));
      const trailing = part.match(/^(.*?)(?:\n+)(Open your appointment): (https:\/\/\S+)$/s);
      if (trailing) return [{ p: trailing[1] ?? "" }, { button: { label: trailing[2] ?? "Open your appointment", href: trailing[3] ?? "" } }];
      return [{ p: part }];
    });
    const heading = m.subject ?? "Hartwell Tax";
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: process.env["RESEND_FROM"] || "Claire Hartwell, EA <onboarding@resend.dev>",
          to: [to], subject: `[Demo] ${heading}`, html: renderEmail(heading, blocks), text: toText(heading, blocks),
        }),
      });
      if (!res.ok) { console.error("Demo copy failed", res.status, await res.text()); return { ok: false as const, reason: res.status === 403 ? "sender" as const : "failed" as const }; }
      return { ok: true as const };
    } catch (error) {
      console.error("Demo copy failed", error);
      return { ok: false as const, reason: "failed" as const };
    }
  });
