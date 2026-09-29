import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const tokenSchema = z.string().regex(/^[a-f0-9]{64}$/);

export async function requestOrigin() {
  const { getRequest } = await import("@tanstack/react-start/server");
  try { return new URL(getRequest().url).origin; } catch { return process.env["SITE_URL"] ?? ""; }
}

/** Owner: run all automations now (same as the 15-minute schedule). */
export const runAutomationsNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isOwner } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isOwner) throw new Error("Forbidden");
    const { runAutomations } = await import("./automations.server");
    return runAutomations(await requestOrigin());
  });

/** Waitlist: first to claim gets the slot. */
export const getOffer = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ token: tokenSchema }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: o } = await supabaseAdmin.from("waitlist_offers")
      .select("status, slot_start, services(name, duration_min)").eq("token", data.token).maybeSingle();
    if (!o) return null;
    const svc = o.services as { name: string; duration_min: number } | null;
    return { status: o.status, slotStart: o.slot_start, service: svc?.name ?? "", minutes: svc?.duration_min ?? 0 };
  });

export const claimOffer = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: tokenSchema }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { getNow } = await import("./clock.server");
    const { data: o } = await supabaseAdmin.from("waitlist_offers")
      .select("id, status, slot_start, service_id, waitlist_id, waitlist(client_id, clients(name, email))").eq("token", data.token).maybeSingle();
    if (!o) return { ok: false as const, reason: "missing" as const };
    if (o.status !== "open") return { ok: false as const, reason: "missed" as const };
    const c = (o.waitlist as { clients: { name: string; email: string } | null } | null)?.clients;
    if (!c) return { ok: false as const, reason: "missing" as const };
    const now = await getNow();
    const { data: res } = await supabaseAdmin.rpc("book_appointment", {
      _service_id: o.service_id, _start: o.slot_start, _now: now.toISOString(), _name: c.name, _email: c.email,
      _phone: "", _meeting_type: "in_person", _intake: {} as never,
    });
    const r = res as { ok: boolean; appointment_id?: string; manage_token?: string } | null;
    if (!r?.ok) {
      await supabaseAdmin.from("waitlist_offers").update({ status: "missed" }).eq("id", o.id);
      await supabaseAdmin.from("waitlist").update({ status: "waiting" }).eq("id", o.waitlist_id).eq("status", "offered");
      return { ok: false as const, reason: "missed" as const };
    }
    await supabaseAdmin.from("waitlist_offers").update({ status: "claimed" }).eq("id", o.id);
    await supabaseAdmin.from("waitlist").update({ status: "booked" }).eq("id", o.waitlist_id);
    // Everyone else offered this slot keeps their place on the list.
    const { data: others } = await supabaseAdmin.from("waitlist_offers").select("id, waitlist_id")
      .eq("service_id", o.service_id).eq("slot_start", o.slot_start).eq("status", "open");
    for (const x of others ?? []) {
      await supabaseAdmin.from("waitlist_offers").update({ status: "missed" }).eq("id", x.id);
      await supabaseAdmin.from("waitlist").update({ status: "waiting" }).eq("id", x.waitlist_id).eq("status", "offered");
    }
    const { sendBookingConfirmation } = await import("./automations.server");
    await sendBookingConfirmation(r.appointment_id!, await requestOrigin()).catch(console.error);
    return { ok: true as const, manageToken: r.manage_token! };
  });

/** Abandoned-booking link: returns the saved partial booking. */
export const getLeadDraft = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: l } = await supabaseAdmin.from("leads").select("email, name, partial_booking, converted").eq("id", data.id).maybeSingle();
    if (!l || l.converted) return null;
    const p = (l.partial_booking ?? {}) as { service?: string; slot?: string; meeting_type?: "in_person" | "video"; answers?: Record<string, unknown> };
    return { email: l.email, name: l.name ?? "", service: p.service ?? null, meetingType: p.meeting_type ?? "in_person", answers: JSON.parse(JSON.stringify(p.answers ?? {})) as Record<string, number | boolean> };
  });
