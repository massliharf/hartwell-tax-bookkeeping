import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Ask = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(200),
  question: z.string().trim().min(5).max(2000),
});

/** Public: a visitor asks a question. Simple practical questions get an automatic answer; anything personal goes to Claire. */
export const submitInquiry = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Ask.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin: s } = await import("@/integrations/supabase/client.server");
    const { classifyInquiry } = await import("./inquiry.server");
    const { requestOrigin } = await import("./origin.server");
    const origin = requestOrigin();
    const ai = await classifyInquiry(data.question, origin);
    const { data: row, error } = await s.from("inquiries").insert({
      name: data.name, email: data.email.toLowerCase(), question: data.question,
      status: ai.auto ? "auto_answered" : "needs_claire", ai_reply: ai.reply,
      ...(ai.auto ? { reply: ai.reply, replied_at: new Date().toISOString() } : {}),
    }).select("id").single();
    if (error || !row) return { ok: false as const };
    if (ai.auto && ai.reply) {
      const { sendInquiryReply } = await import("./inquiry.server");
      await sendInquiryReply(row.id, data.email, data.name, data.question, ai.reply, origin, 10);
    }
    return { ok: true as const, auto: ai.auto, reply: ai.auto ? ai.reply : null };
  });

/** Owner: send (or edit and send) the reply to a question. */
export const replyInquiry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), reply: z.string().trim().min(1).max(4000) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: isOwner } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isOwner) throw new Error("Forbidden");
    const { supabaseAdmin: s } = await import("@/integrations/supabase/client.server");
    const { data: q } = await s.from("inquiries").select("*").eq("id", data.id).maybeSingle();
    if (!q) return { ok: false };
    const { sendInquiryReply } = await import("./inquiry.server");
    const { requestOrigin } = await import("./origin.server");
    await sendInquiryReply(q.id, q.email, q.name, q.question, data.reply, requestOrigin(), 5);
    await s.from("inquiries").update({ status: "answered", reply: data.reply, replied_at: new Date().toISOString() }).eq("id", q.id);
    return { ok: true };
  });
