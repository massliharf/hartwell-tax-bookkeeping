import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";

// Called every 15 minutes by the scheduler. Safe to call any time: every message is deduplicated.
async function authorized(request: Request) {
  if ((await authenticateCronRequest(request.clone())) === null) return true;
  const token = /^Bearer ([a-f0-9]{64})$/.exec(request.headers.get("authorization") ?? "")?.[1];
  if (!token) return false;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("automation_config").select("cron_token").eq("id", 1).maybeSingle();
  if (!data?.cron_token || data.cron_token.length !== token.length) return false;
  const { timingSafeEqual } = await import("node:crypto");
  return timingSafeEqual(Buffer.from(data.cron_token), Buffer.from(token));
}

export const Route = createFileRoute("/api/public/cron/automations")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!(await authorized(request))) return new Response("Unauthorized", { status: 401 });
        const { runAutomations } = await import("@/lib/automations.server");
        const origin = process.env["SITE_URL"] || new URL(request.url).origin;
        return Response.json(await runAutomations(origin));
      },
    },
  },
});
