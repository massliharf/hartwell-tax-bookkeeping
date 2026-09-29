import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const tokenSchema = z.string().regex(/^[a-f0-9]{64}$/);

/** Owner: run all automations now (same as the 15-minute schedule). */
export const runAutomationsNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isOwner } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isOwner) throw new Error("Forbidden");
    const { runAutomations } = await import("./automations.server");
    const { requestOrigin } = await import("./origin.server");
    return runAutomations(requestOrigin());
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
    const { claimOfferByToken } = await import("./automations.server");
    const { requestOrigin } = await import("./origin.server");
    return claimOfferByToken(data.token, requestOrigin());
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
