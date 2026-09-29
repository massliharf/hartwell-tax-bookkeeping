import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { DEMO_EMAIL, DEMO_PASSWORD } from "./demo";

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
    const { s, origin } = await owner(context);
    const { data: st } = await s.from("settings").select("demo_time_offset_minutes").eq("id", 1).single();
    await s.from("settings").update({ demo_time_offset_minutes: (st?.demo_time_offset_minutes ?? 0) + data.days * 1440 }).eq("id", 1);
    const { runAutomations } = await import("./automations.server");
    const r = await runAutomations(origin);
    const n = Object.values(r.sent as Record<string, number>).reduce((a, b) => a + b, 0);
    return { message: `Jumped ${data.days} day${data.days > 1 ? "s" : ""} ahead. ${n} message${n === 1 ? "" : "s"} went out.` };
  });

export const demoUpload = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { s, getNow } = await owner(context);
  const now = (await getNow()).toISOString();
  const { data: items } = await s.from("checklist_items")
    .select("id, document_name, appointment_id, appointments!inner(start_at, status, clients(name))")
    .eq("status", "missing").eq("required", true).in("appointments.status", ["booked", "confirmed"])
    .gt("appointments.start_at", now).order("start_at", { referencedTable: "appointments" }).limit(1);
  const it = items?.[0];
  if (!it) return { message: "No missing documents left to upload." };
  const path = `${it.appointment_id}/${it.id}-demo.pdf`;
  const pdf = "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 300 200]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF";
  await s.storage.from("client-documents").upload(path, new Blob([pdf], { type: "application/pdf" }), { upsert: true });
  await s.from("checklist_items").update({ status: "uploaded", file_path: path, uploaded_at: now }).eq("id", it.id);
  const name = (it.appointments as unknown as { clients: { name: string } | null }).clients?.name ?? "A client";
  return { message: `${name} uploaded "${it.document_name}".` };
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
