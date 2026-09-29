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

/** One-time: creates Priya's account. Refuses once any owner exists. */
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
    const origin = await requestOrigin();
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
    const portal = `${await requestOrigin()}/a/${a.manage_token}`;
    const sent = await sendMessage({
      dedupeKey: `sign-manual:${a.id}:${Date.now()}`, type: "signature_reminder", minutesSaved: 6, clientId: c.id, appointmentId: a.id, to: c.email,
      subject: "One signature and you're filed", heading: "One signature and you're filed.",
      blocks: [{ p: `Hi ${c.name.split(" ")[0]}, your return is ready. Priya just needs your e-file authorization (Form 8879). It takes about a minute.` }, { button: { label: "Sign now", href: portal } }],
    });
    return { ok: sent };
  });
