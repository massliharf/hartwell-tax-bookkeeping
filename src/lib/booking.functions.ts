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
      _phone: data.phone ?? "",
      _meeting_type: data.meetingType,
      _intake: data.intake as never,
    });
    if (error) {
      console.error(error);
      return { ok: false as const, alternatives: [] as string[], error: "Something went wrong. Please try again." };
    }
    const r = res as { ok: boolean; appointment_id?: string; manage_token?: string; alternatives?: string[] };
    if (!r.ok) return { ok: false as const, alternatives: r.alternatives ?? [], error: "That time was just taken." };
    return { ok: true as const, appointmentId: r.appointment_id!, manageToken: r.manage_token! };
  });
