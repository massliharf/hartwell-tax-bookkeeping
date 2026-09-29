import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";

// Called every 15 minutes by the scheduler. Safe to call any time: every message is deduplicated.
export const Route = createFileRoute("/api/public/cron/automations")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const denied = await authenticateCronRequest(request);
        if (denied) return denied;
        const { runAutomations } = await import("@/lib/automations.server");
        const origin = process.env["SITE_URL"] || new URL(request.url).origin;
        const result = await runAutomations(origin);
        return Response.json(result);
      },
    },
  },
});
