// Single source of "now" for all server logic: real time + demo offset from settings.
export async function getNow(): Promise<Date> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("settings").select("demo_time_offset_minutes").eq("id", 1).maybeSingle();
  const offset = data?.demo_time_offset_minutes ?? 0;
  return new Date(Date.now() + offset * 60_000);
}
