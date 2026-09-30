import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/*
 * Client portal. No login: every function validates the unguessable
 * manage_token and only touches that one appointment (admin client, RLS
 * bypassed on purpose after the token check).
 */
const BUCKET = "client-documents";
const MAX_BYTES = 15 * 1024 * 1024;
const ALLOWED_EXT = ["pdf", "jpg", "jpeg", "png", "heic", "heif"];
const tokenSchema = z.string().regex(/^[a-f0-9]{64}$/);

async function appointmentByToken(token: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("appointments")
    .select("id, service_id, start_at, end_at, meeting_type, status, ready_score, signature_status, signed_at, fee_cents, client_note, paid_at, filed_at, finished_at, intake_answers, services(name, duration_min, slug), clients(name)")
    .eq("manage_token", token)
    .maybeSingle();
  return { supabaseAdmin, appt: data };
}

/** Client view of their appointment + checklist, via their private link. */
export const getAppointmentByToken = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ token: tokenSchema }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin, appt } = await appointmentByToken(data.token);
    if (!appt) return { appointment: null, checklist: [], now: null, videoLink: null };
    const { getNow } = await import("./clock.server");
    const [{ data: items }, now, { data: st }] = await Promise.all([
      supabaseAdmin
        .from("checklist_items")
        .select("id, document_name, description, required, status, uploaded_at, na_reason, ai_check, ai_note, review_status, fix_reason, fix_note")
        .eq("appointment_id", appt.id)
        .order("sort_order"),
      getNow(),
      supabaseAdmin.from("settings").select("video_link").eq("id", 1).maybeSingle(),
    ]);
    return { appointment: appt, checklist: items ?? [], now: now.toISOString(), videoLink: appt.meeting_type === "video" ? st?.video_link ?? null : null };
  });

/** Returns a one-time signed upload URL scoped to this appointment's folder. */
export const createUploadUrl = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({ token: tokenSchema, itemId: z.string().uuid(), fileName: z.string().min(1).max(200), size: z.number().int().positive().max(MAX_BYTES).optional() }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin, appt } = await appointmentByToken(data.token);
    if (!appt) throw new Error("Link not found");
    const { data: item } = await supabaseAdmin
      .from("checklist_items").select("id").eq("id", data.itemId).eq("appointment_id", appt.id).maybeSingle();
    if (!item) throw new Error("Item not found");
    const ext = (data.fileName.split(".").pop() ?? "").replace(/[^a-z0-9]/gi, "").toLowerCase();
    if (!ALLOWED_EXT.includes(ext)) throw new Error("Please upload a PDF, JPG, PNG or HEIC.");
    const path = `${appt.id}/${item.id}-${crypto.randomUUID()}.${ext}`;
    const { data: signed, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUploadUrl(path);
    if (error || !signed) throw new Error("Could not prepare upload");
    return { path, token: signed.token };
  });

/** Marks the checklist item as uploaded once the file exists in storage (and is within 15MB). */
export const confirmUpload = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: tokenSchema, itemId: z.string().uuid(), path: z.string().max(300) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin, appt } = await appointmentByToken(data.token);
    if (!appt || !data.path.startsWith(`${appt.id}/${data.itemId}-`)) throw new Error("Not allowed");
    const [folder = "", name = ""] = data.path.split("/");
    const { data: files } = await supabaseAdmin.storage.from(BUCKET).list(folder, { search: name });
    const file = files?.find((f) => f.name === name);
    if (!file) throw new Error("File not found");
    const size = Number((file.metadata as { size?: number } | null)?.size ?? 0);
    if (size === 0 || size > MAX_BYTES) {
      await supabaseAdmin.storage.from(BUCKET).remove([data.path]);
      throw new Error(size === 0 ? "That file is empty." : "That file is over 15MB.");
    }
    const { getNow } = await import("./clock.server");
    await supabaseAdmin
      .from("checklist_items")
      .update({ status: "uploaded", file_path: data.path, na_reason: null, uploaded_at: (await getNow()).toISOString(), review_status: "pending", ai_check: null, ai_note: null, fix_reason: null, fix_note: null })
      .eq("id", data.itemId)
      .eq("appointment_id", appt.id);
    const { aiCheckDocument } = await import("./doccheck.server");
    await aiCheckDocument(data.itemId);
    return { ok: true };
  });

export const markNotApplicable = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: tokenSchema, itemId: z.string().uuid(), reason: z.string().trim().min(2).max(200) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin, appt } = await appointmentByToken(data.token);
    if (!appt) throw new Error("Link not found");
    await supabaseAdmin
      .from("checklist_items")
      .update({ status: "not_applicable", na_reason: data.reason })
      .eq("id", data.itemId).eq("appointment_id", appt.id).neq("status", "uploaded");
    return { ok: true };
  });

export const undoNotApplicable = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: tokenSchema, itemId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin, appt } = await appointmentByToken(data.token);
    if (!appt) throw new Error("Link not found");
    await supabaseAdmin
      .from("checklist_items").update({ status: "missing", na_reason: null })
      .eq("id", data.itemId).eq("appointment_id", appt.id).eq("status", "not_applicable");
    return { ok: true };
  });

async function upcoming(token: string) {
  const r = await appointmentByToken(token);
  if (!r.appt) throw new Error("Link not found");
  const { getNow } = await import("./clock.server");
  const now = await getNow();
  const open = ["booked", "confirmed"].includes(r.appt.status) && new Date(r.appt.start_at) > now;
  return { ...r, appt: r.appt, now, open };
}

export const confirmAttendance = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: tokenSchema }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin, appt, open } = await upcoming(data.token);
    if (!open) return { ok: false };
    await supabaseAdmin.from("appointments").update({ status: "confirmed" }).eq("id", appt.id).eq("status", "booked");
    return { ok: true };
  });

async function freeSlot(serviceId: string, start: string) {
  const { offerFreedSlot } = await import("./automations.server");
  const { requestOrigin } = await import("./origin.server");
  await offerFreedSlot(serviceId, start, requestOrigin()).catch(console.error);
}

export const cancelAppointment = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: tokenSchema }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin, appt, open } = await upcoming(data.token);
    if (!open) return { ok: false };
    await supabaseAdmin.from("appointments").update({ status: "cancelled" }).eq("id", appt.id);
    await freeSlot(appt.service_id, appt.start_at);
    return { ok: true };
  });

export const rescheduleAppointment = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: tokenSchema, start: z.string().datetime({ offset: true }) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin, appt, open, now } = await upcoming(data.token);
    if (!open) return { ok: false as const, alternatives: [] as string[] };
    const { data: res, error } = await supabaseAdmin.rpc("reschedule_appointment", {
      _id: appt.id, _start: new Date(data.start).toISOString(), _now: now.toISOString(),
    });
    if (error) {
      console.error(error);
      return { ok: false as const, alternatives: [] as string[] };
    }
    const r = res as { ok: boolean; alternatives?: string[] };
    if (!r.ok) return { ok: false as const, alternatives: r.alternatives ?? [] };
    await supabaseAdmin.from("appointments").update({ needs_attention: false, attention_reason: null }).eq("id", appt.id);
    await freeSlot(appt.service_id, appt.start_at);
    return { ok: true as const, alternatives: [] as string[] };
  });

/** Simple e-sign for Form 8879: typed full name + consent. */
export const signForm8879 = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: tokenSchema, fullName: z.string().trim().min(2).max(120), agree: z.literal(true) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin, appt } = await appointmentByToken(data.token);
    if (!appt || appt.signature_status !== "pending") return { ok: false };
    const { getNow } = await import("./clock.server");
    await supabaseAdmin
      .from("appointments")
      .update({ signature_status: "signed", signed_name: data.fullName, signed_at: (await getNow()).toISOString() })
      .eq("id", appt.id).eq("signature_status", "pending");
    return { ok: true };
  });

/** Owner only: short-lived link to view a client's document. */
export const getDocumentUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ itemId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: isOwner } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isOwner) throw new Error("Forbidden");
    const { data: item } = await context.supabase.from("checklist_items").select("file_path").eq("id", data.itemId).maybeSingle();
    if (!item?.file_path) return { url: null };
    const { data: signed } = await context.supabase.storage.from(BUCKET).createSignedUrl(item.file_path, 60);
    return { url: signed?.signedUrl ?? null };
  });

/** Client keeps a file the AI flagged. */
export const keepFlaggedFile = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: tokenSchema, itemId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin, appt } = await appointmentByToken(data.token);
    if (!appt) throw new Error("Link not found");
    await supabaseAdmin.from("checklist_items").update({ ai_check: "kept" }).eq("id", data.itemId).eq("appointment_id", appt.id).eq("ai_check", "warning");
    return { ok: true };
  });

/** Test payment (used until Stripe is enabled): marks the fee paid. */
export const testPay = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: tokenSchema }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin, appt } = await appointmentByToken(data.token);
    if (!appt || appt.status !== "completed" || appt.paid_at || !appt.fee_cents) return { ok: false };
    const { getNow } = await import("./clock.server");
    await supabaseAdmin.from("appointments").update({ paid_at: (await getNow()).toISOString(), paid_method: "test" }).eq("id", appt.id).is("paid_at", null);
    return { ok: true };
  });

/** Phone-in bookings: the client answers the intake questions from their link; the checklist is rebuilt. */
export const saveIntake = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: tokenSchema, intake: z.record(z.string(), z.unknown()) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin, appt } = await appointmentByToken(data.token);
    if (!appt) throw new Error("Link not found");
    const cur = (appt.intake_answers ?? {}) as Record<string, unknown>;
    if (!cur["intake_pending"] || !["booked", "confirmed"].includes(appt.status)) return { ok: false };
    const intake = { ...data.intake };
    delete intake["intake_pending"];
    await supabaseAdmin.from("appointments").update({ intake_answers: intake as never }).eq("id", appt.id);
    await supabaseAdmin.rpc("generate_checklist", { _appointment_id: appt.id });
    await supabaseAdmin.rpc("compute_ready_score", { _id: appt.id });
    return { ok: true };
  });
