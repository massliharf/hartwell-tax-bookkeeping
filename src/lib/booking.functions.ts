import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/*
 * Availability + booking. The rules live in the database functions
 * `available_slots` and `book_appointment` (hours/buffer from settings,
 * 15-min grid, 3h lead time from getNow(), must end by closing, no overlap
 * with booked/confirmed appointments incl. 15-min buffer). Booking takes a
 * lock and re-checks the slot inside the same transaction, so two people can
 * never get the same slot.
 *
 * Test cases (demo clock: Thu Oct 1 2026, 08:00 ET):
 * 1. Self-employed (75 min) at 16:45 on a weekday → would end 18:00, not
 *    before closing → rejected; latest 75-min start is 16:30.
 * 2. Individual return (45 min) Saturday 13:30 → ends 14:15, after 14:00 → rejected.
 * 3. Any Sunday → no hours in settings → empty list.
 * 4. Same slot booked by someone else a second earlier → the lock makes the
 *    second request re-check after the first commits → ok:false with the
 *    3 nearest available alternatives.
 */

const MeetingType = z.enum(["in_person", "video"]);

export const getAvailability = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z.object({
      serviceId: z.string().uuid(),
      from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { getNow } = await import("./clock.server");
    const now = await getNow();
    const { data: slots, error } = await supabaseAdmin.rpc("available_slots", {
      _service_id: data.serviceId, _from: data.from, _to: data.to, _now: now.toISOString(),
    });
    if (error) {
      console.error(error);
      return { slots: [] as string[], error: "Could not load times. Please try again." };
    }
    return { slots: (slots ?? []) as string[], error: null };
  });

export const bookAppointment = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({
      serviceId: z.string().uuid(),
      start: z.string().datetime({ offset: true }),
      name: z.string().trim().min(1).max(120),
      email: z.string().trim().email().max(200),
      phone: z.string().trim().max(40).optional(),
      meetingType: MeetingType,
      intake: z.record(z.string(), z.unknown()).default({}),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { getNow } = await import("./clock.server");
    const now = await getNow();
    const { data: res, error } = await supabaseAdmin.rpc("book_appointment", {
      _service_id: data.serviceId,
      _start: new Date(data.start).toISOString(),
      _now: now.toISOString(),
      _name: data.name,
      _email: data.email,
      _phone: data.phone ?? "",  // empty keeps a returning client's saved phone
      _meeting_type: data.meetingType,
      _intake: data.intake as never,
    });
    if (error) {
      console.error(error);
      return { ok: false as const, alternatives: [] as string[], error: "Something went wrong. Please try again." };
    }
    const r = res as { ok: boolean; appointment_id?: string; manage_token?: string; alternatives?: string[] };
    if (r.ok) {
      await supabaseAdmin.from("leads").update({ converted: true }).eq("email", data.email.toLowerCase()).eq("converted", false);
    }
    if (!r.ok) return { ok: false as const, alternatives: r.alternatives ?? [], error: "That time was just taken." };
    return { ok: true as const, appointmentId: r.appointment_id!, manageToken: r.manage_token! };
  });

const TZ = "America/New_York";
const ymdInTz = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
const addDays = (ymd: string, n: number) => {
  const d = new Date(`${ymd}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const DOW = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

/** Next N days from getNow(), each with its open slots (or closed/full). */
export const getAvailabilityWindow = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ serviceId: z.string().uuid(), days: z.number().int().min(1).max(21) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { getNow } = await import("./clock.server");
    const now = await getNow();
    const from = ymdInTz(now);
    const to = addDays(from, data.days - 1);
    const [{ data: slots, error }, { data: settings }] = await Promise.all([
      supabaseAdmin.rpc("available_slots", { _service_id: data.serviceId, _from: from, _to: to, _now: now.toISOString() }),
      supabaseAdmin.from("settings").select("hours").eq("id", 1).single(),
    ]);
    if (error) {
      console.error(error);
      return { days: [], error: "We couldn't load times just now. Please try again." };
    }
    const hours = (settings?.hours ?? {}) as Record<string, unknown>;
    const byDay = new Map<string, string[]>();
    for (const s of (slots ?? []) as string[]) {
      const k = ymdInTz(new Date(s));
      byDay.set(k, [...(byDay.get(k) ?? []), s]);
    }
    const days = Array.from({ length: data.days }, (_, i) => {
      const date = addDays(from, i);
      const dow = DOW[new Date(`${date}T12:00:00Z`).getUTCDay()]!;
      return { date, closed: !hours[dow], slots: byDay.get(date) ?? [] };
    });
    return { days, error: null };
  });

/** Saves / updates an unfinished booking so Priya can follow up. */
export const saveLead = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({
      email: z.string().trim().email().max(200),
      name: z.string().trim().max(120).optional(),
      partial: z.record(z.string(), z.unknown()),
      lastStep: z.string().max(40),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = data.email.toLowerCase();
    const { data: existing } = await supabaseAdmin
      .from("leads").select("id").eq("email", email).eq("converted", false)
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    const row = { email, name: data.name || null, partial_booking: data.partial as never, last_step: data.lastStep };
    if (existing) await supabaseAdmin.from("leads").update(row).eq("id", existing.id);
    else await supabaseAdmin.from("leads").insert(row);
    return { ok: true };
  });

export const joinWaitlist = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({
      serviceId: z.string().uuid(),
      name: z.string().trim().min(1).max(120),
      email: z.string().trim().email().max(200),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = data.email.toLowerCase();
    let { data: client } = await supabaseAdmin.from("clients").select("id").eq("email", email).maybeSingle();
    if (!client) {
      const ins = await supabaseAdmin.from("clients").insert({ name: data.name, email }).select("id").single();
      client = ins.data;
    }
    if (!client) return { ok: false };
    const dow = DOW[new Date(`${data.date}T12:00:00Z`).getUTCDay()]!;
    await supabaseAdmin.from("waitlist").insert({ client_id: client.id, service_id: data.serviceId, preferred_days: [dow] });
    return { ok: true };
  });

/** Returning client lookup. Returns only what's needed to prefill; phone is masked. */
export const lookupReturning = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ email: z.string().trim().email().max(200) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: client } = await supabaseAdmin
      .from("clients").select("id, name, phone").eq("email", data.email.toLowerCase()).maybeSingle();
    if (!client) return { found: false as const };
    const { data: last } = await supabaseAdmin
      .from("appointments").select("intake_answers, services(slug)")
      .eq("client_id", client.id).order("start_at", { ascending: false }).limit(1).maybeSingle();
    return {
      found: true as const,
      name: client.name,
      phoneHint: client.phone ? `ending in ${client.phone.slice(-4)}` : null,
      intake: JSON.parse(JSON.stringify(last?.intake_answers ?? {})) as Record<string, string | number | boolean | string[] | null>,
      serviceSlug: (last?.services as { slug: string } | null)?.slug ?? null,
    };
  });
