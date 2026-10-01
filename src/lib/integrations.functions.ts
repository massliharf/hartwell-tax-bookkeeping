import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** What is connected, for the Settings > Integrations screen. Owner only. */
export const getIntegrations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isOwner } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isOwner) throw new Error("Forbidden");
    const { calendarToken } = await import("./integrations.server");
    return {
      calendarToken: calendarToken(),
      email: { connected: !!process.env["RESEND_API_KEY"], verifiedSender: !!process.env["RESEND_FROM"], from: process.env["RESEND_FROM"] || "Claire Hartwell, EA <onboarding@resend.dev>" },
      sms: { connected: !!process.env["TWILIO_AUTH_TOKEN"] },
      payments: { connected: !!process.env["STRIPE_SECRET_KEY"] },
    };
  });
