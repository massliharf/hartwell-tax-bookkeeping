import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const BUCKET = "client-documents";
const tokenSchema = z.string().regex(/^[a-f0-9]{64}$/);

async function appointmentByToken(token: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("appointments")
    .select("id, start_at, end_at, meeting_type, status, ready_score, signature_status, services(name, duration_min), clients(name)")
    .eq("manage_token", token)
    .maybeSingle();
  return { supabaseAdmin, appt: data };
}

/** Client view of their appointment + checklist, via their private link. */
export const getAppointmentByToken = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ token: tokenSchema }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin, appt } = await appointmentByToken(data.token);
    if (!appt) return { appointment: null, checklist: [] };
    const { data: items } = await supabaseAdmin
      .from("checklist_items")
      .select("id, document_name, description, required, status, uploaded_at")
      .eq("appointment_id", appt.id)
      .order("sort_order");
    return { appointment: appt, checklist: items ?? [] };
  });

/** Returns a one-time signed upload URL scoped to this appointment's folder. */
export const createUploadUrl = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({ token: tokenSchema, itemId: z.string().uuid(), fileName: z.string().min(1).max(200) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin, appt } = await appointmentByToken(data.token);
    if (!appt) throw new Error("Link not found");
    const { data: item } = await supabaseAdmin
      .from("checklist_items").select("id").eq("id", data.itemId).eq("appointment_id", appt.id).maybeSingle();
    if (!item) throw new Error("Item not found");
    const ext = (data.fileName.split(".").pop() ?? "bin").replace(/[^a-z0-9]/gi, "").slice(0, 8).toLowerCase();
    const path = `${appt.id}/${item.id}-${crypto.randomUUID()}.${ext}`;
    const { data: signed, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUploadUrl(path);
    if (error || !signed) throw new Error("Could not prepare upload");
    return { path, token: signed.token };
  });

/** Marks the checklist item as uploaded once the file exists in storage. */
export const confirmUpload = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: tokenSchema, itemId: z.string().uuid(), path: z.string().max(300) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin, appt } = await appointmentByToken(data.token);
    if (!appt || !data.path.startsWith(`${appt.id}/${data.itemId}-`)) throw new Error("Not allowed");
    const folder = data.path.split("/")[0];
    const name = data.path.split("/")[1];
    const { data: files } = await supabaseAdmin.storage.from(BUCKET).list(folder, { search: name });
    if (!files?.some((f) => f.name === name)) throw new Error("File not found");
    const { getNow } = await import("./clock.server");
    await supabaseAdmin
      .from("checklist_items")
      .update({ status: "uploaded", file_path: data.path, uploaded_at: (await getNow()).toISOString() })
      .eq("id", data.itemId)
      .eq("appointment_id", appt.id);
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
