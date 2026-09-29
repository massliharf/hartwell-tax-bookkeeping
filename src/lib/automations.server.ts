// Follow-through automations. Everything uses getNow() and is idempotent via messages.dedupe_key.
import { sendMessage, buildIcs, fmtDate, fmtTime, OFFICE, MAP_URL, type Block } from "./email.server";

const H = 3_600_000;
const D = 24 * H;

async function db() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

type Appt = {
  id: string; start_at: string; end_at: string; meeting_type: "in_person" | "video"; status: string;
  ready_score: number; signature_status: string; manage_token: string; created_at: string; service_id: string;
  clients: { id: string; name: string; email: string; phone: string | null } | null;
  services: { name: string; slug: string } | null;
};
const APPT_COLS = "id, start_at, end_at, meeting_type, status, ready_score, signature_status, manage_token, created_at, service_id, clients(id, name, email, phone), services(name, slug)";

const first = (n: string) => n.split(" ")[0] ?? n;
const where = (a: Appt): Block =>
  a.meeting_type === "video"
    ? { p: "This is a video call. Your join link will arrive by email shortly before the meeting." }
    : { p: `We'll meet at the office: ${OFFICE}. Map: ${MAP_URL}` };

async function missingDocs(apptId: string) {
  const s = await db();
  const { data } = await s.from("checklist_items").select("document_name, required, status").eq("appointment_id", apptId).order("sort_order");
  return {
    all: (data ?? []).map((d) => d.document_name),
    missing: (data ?? []).filter((d) => d.required && d.status === "missing").map((d) => d.document_name),
  };
}

/* ---------- Booking confirmation (immediate) ---------- */
export async function sendBookingConfirmation(apptId: string, origin: string) {
  const s = await db();
  const { data } = await s.from("appointments").select(APPT_COLS).eq("id", apptId).maybeSingle();
  const a = data as Appt | null;
  if (!a?.clients) return;
  const docs = await missingDocs(a.id);
  const portal = `${origin}/a/${a.manage_token}`;
  const when = `${fmtDate(a.start_at)} at ${fmtTime(a.start_at)}`;
  await sendMessage({
    dedupeKey: `confirm:${a.id}:${a.start_at}`, type: "booking_confirmation", minutesSaved: 5,
    clientId: a.clients.id, appointmentId: a.id, to: a.clients.email,
    subject: `You're booked: ${when}`,
    heading: `You're booked, ${first(a.clients.name)}.`,
    blocks: [
      { p: `${a.services?.name ?? "Your appointment"} on ${when} (Eastern).` },
      where(a),
      ...(docs.all.length ? [{ p: "Here is your personal checklist. Upload whenever it suits you, there's no rush today." } as Block, { list: docs.all }] : []),
      { button: { label: "Open your checklist", href: portal } },
      { note: "A calendar invite is attached. Your documents go to private storage that only Priya can see." },
    ],
    ics: buildIcs({ id: a.id, start: a.start_at, end: a.end_at, title: `Patel Tax: ${a.services?.name ?? "Appointment"}`,
      location: a.meeting_type === "video" ? "Video call" : OFFICE, description: `Your checklist: ${portal}` }),
    sms: `Patel Tax: you're booked for ${when}. Your checklist: ${portal}`,
  });
}

/* ---------- Freed slot → waitlist (immediate) ---------- */
export async function offerFreedSlot(serviceId: string, slotStart: string, origin: string) {
  const s = await db();
  const { getNow } = await import("./clock.server");
  const now = await getNow();
  if (new Date(slotStart).getTime() < now.getTime() + 3 * H) return; // too soon to be useful
  const { data: list } = await s.from("waitlist")
    .select("id, client_id, clients(name, email)").eq("service_id", serviceId).in("status", ["waiting", "offered"])
    .order("created_at");
  const { data: svc } = await s.from("services").select("name").eq("id", serviceId).maybeSingle();
  for (const w of list ?? []) {
    const c = w.clients as { name: string; email: string } | null;
    if (!c) continue;
    const { data: offer } = await s.from("waitlist_offers")
      .upsert({ waitlist_id: w.id, service_id: serviceId, slot_start: slotStart }, { onConflict: "waitlist_id,slot_start", ignoreDuplicates: false })
      .select("token").single();
    if (!offer) continue;
    await s.from("waitlist").update({ status: "offered" }).eq("id", w.id).eq("status", "waiting");
    const when = `${fmtDate(slotStart)} at ${fmtTime(slotStart)}`;
    const link = `${origin}/claim/${offer.token}`;
    await sendMessage({
      dedupeKey: `waitlist:${w.id}:${slotStart}`, type: "waitlist_offer", minutesSaved: 15,
      clientId: w.client_id, to: c.email,
      subject: `A spot just opened: ${when}`,
      heading: "A spot just opened up.",
      blocks: [
        { p: `Hi ${first(c.name)}, a ${svc?.name ?? ""} slot is free on ${when}. It goes to whoever claims it first.` },
        { button: { label: "Claim this time", href: link } },
        { note: "If it's taken before you tap, you stay on the waitlist. Nothing to do." },
      ],
      sms: `Patel Tax: a spot opened ${when}. First to claim gets it: ${link}`,
    });
  }
}

/* ---------- Scheduled run ---------- */
export async function runAutomations(origin: string) {
  const s = await db();
  const { getNow } = await import("./clock.server");
  const now = await getNow();
  const t = now.getTime();
  const iso = (ms: number) => new Date(ms).toISOString();
  const counts: Record<string, number> = {};
  const { data: st } = await s.from("settings").select("reminder_timings").eq("id", 1).maybeSingle();
  const rt = { docs_reminder_days: 7, readiness_check_hours: 48, final_reminder_hours: 24, abandoned_nudge_hours: 1, ...((st?.reminder_timings ?? {}) as Record<string, number>) };
  const docsD = Number(rt.docs_reminder_days) || 7, readyH = Number(rt.readiness_check_hours) || 48;
  const finalH = Number(rt.final_reminder_hours) || 24, nudgeH = Number(rt.abandoned_nudge_hours) || 1;
  const hit = (k: string, sent: boolean) => { if (sent) counts[k] = (counts[k] ?? 0) + 1; };

  // Upcoming appointments within 7 days
  const { data: up } = await s.from("appointments").select(APPT_COLS)
    .in("status", ["booked", "confirmed"]).gt("start_at", iso(t)).lte("start_at", iso(t + Math.max(docsD * D, readyH * H))).order("start_at");

  for (const a of (up ?? []) as Appt[]) {
    if (!a.clients) continue;
    const c = a.clients;
    const until = new Date(a.start_at).getTime() - t;
    const portal = `${origin}/a/${a.manage_token}`;
    const when = `${fmtDate(a.start_at)} at ${fmtTime(a.start_at)}`;
    const key = (k: string) => `${k}:${a.id}:${a.start_at}`;

    // Confirmation catch-up (if the immediate send was missed)
    await sendBookingConfirmation(a.id, origin);

    // 7 days before: missing docs (skip if booked within the last 12h — they just got their list)
    if (until > readyH * H && until <= docsD * D && t - new Date(a.created_at).getTime() > 12 * H) {
      const { missing } = await missingDocs(a.id);
      if (missing.length) {
        hit("docs_reminder_7d", await sendMessage({
          dedupeKey: key("docs7d"), type: "docs_reminder_7d", minutesSaved: 6, clientId: c.id, appointmentId: a.id, to: c.email,
          subject: `You have ${missing.length} document${missing.length === 1 ? "" : "s"} left`,
          heading: `You have ${missing.length} document${missing.length === 1 ? "" : "s"} left.`,
          blocks: [
            { p: `Hi ${first(c.name)}, your appointment is ${when}. Here's what's still on your list:` },
            { list: missing },
            { button: { label: "Upload from your phone", href: portal } },
            { note: "A clear photo is fine. Files go to private storage only Priya can see." },
          ],
        }));
      }
    }

    // 48 hours before: readiness check
    if (until <= readyH * H && until > finalH * H) {
      if (a.ready_score < 70) {
        const { data: slots } = await s.rpc("available_slots", {
          _service_id: a.service_id, _from: a.start_at.slice(0, 10), _to: iso(new Date(a.start_at).getTime() + 21 * D).slice(0, 10), _now: now.toISOString(),
        });
        const later = ((slots ?? []) as string[]).filter((x) => new Date(x).getTime() > new Date(a.start_at).getTime() + D).slice(0, 3);
        const sent = await sendMessage({
          dedupeKey: key("ready48"), type: "reschedule_offer", minutesSaved: 10, clientId: c.id, appointmentId: a.id, to: c.email,
          subject: "Want to move your appointment so it's not wasted?",
          heading: "Want a little more time?",
          blocks: [
            { p: `Hi ${first(c.name)}, your appointment is ${when}, and a few documents are still missing. If you'd like more time to gather them, you can move to a later slot with one tap.` },
            ...(later.length ? [{ buttons: later.map((x) => ({ label: `${fmtDate(x)}, ${fmtTime(x)}`, href: `${origin}/move/${a.manage_token}?to=${encodeURIComponent(x)}` })) } as Block] : []),
            { button: { label: "Keep my time and upload now", href: portal } },
            { note: "Either way is completely fine. We just want your visit to count." },
          ],
          sms: `Patel Tax: a few documents are still missing for ${when}. Upload or move your time: ${portal}`,
        });
        if (sent) await s.from("appointments").update({ needs_attention: true, attention_reason: `Ready ${a.ready_score}% at 48h check` }).eq("id", a.id);
        hit("readiness_low", sent);
      } else if (a.ready_score >= 100) {
        hit("readiness_ready", await sendMessage({
          dedupeKey: key("ready48"), type: "readiness_check_48h", minutesSaved: 10, clientId: c.id, appointmentId: a.id, to: c.email,
          subject: "You're all set",
          heading: "You're all set.",
          blocks: [{ p: `Hi ${first(c.name)}, Priya has everything she needs for ${when}. See you then.` }, { button: { label: "View your appointment", href: portal } }],
        }));
      }
    }

    // 24 hours before: final reminder
    if (until <= finalH * H) {
      const { all } = await missingDocs(a.id);
      hit("final_reminder_24h", await sendMessage({
        dedupeKey: key("final24"), type: "final_reminder_24h", minutesSaved: 4, clientId: c.id, appointmentId: a.id, to: c.email,
        subject: `See you tomorrow, ${fmtTime(a.start_at)}`,
        heading: "See you tomorrow.",
        blocks: [
          { p: `${a.services?.name ?? "Your appointment"}, ${when}.` },
          where(a),
          { p: "What to bring: a photo ID, plus anything from your list you haven't uploaded yet." },
          ...(all.length ? [{ list: all } as Block] : []),
          { button: { label: "I'll be there", href: `${portal}?confirm=1` } },
        ],
        sms: `Patel Tax: see you ${when}. Tap to confirm: ${portal}?confirm=1`,
      }));
    }
  }

  // After the appointment: signature (1d, 3d) and missing docs (2d). Last 14 days only.
  const { data: past } = await s.from("appointments").select(APPT_COLS)
    .eq("status", "completed").lte("end_at", iso(t - D)).gte("end_at", iso(t - 14 * D));
  for (const a of (past ?? []) as Appt[]) {
    if (!a.clients) continue;
    const c = a.clients;
    const since = t - new Date(a.end_at).getTime();
    const portal = `${origin}/a/${a.manage_token}`;
    if (a.signature_status === "pending") {
      for (const d of [1, 3]) {
        if (since >= d * D) hit("signature_reminder", await sendMessage({
          dedupeKey: `sign${d}d:${a.id}`, type: "signature_reminder", minutesSaved: 6, clientId: c.id, appointmentId: a.id, to: c.email,
          subject: "One signature and you're filed",
          heading: "One signature and you're filed.",
          blocks: [{ p: `Hi ${first(c.name)}, your return is ready. Priya just needs your e-file authorization (Form 8879). It takes about a minute.` }, { button: { label: "Sign now", href: portal } }],
          sms: `Patel Tax: your return is ready to file. Sign here: ${portal}`,
        }));
      }
    }
    if (since >= 2 * D) {
      const { missing } = await missingDocs(a.id);
      if (missing.length) hit("missing_docs_after", await sendMessage({
        dedupeKey: `missing2d:${a.id}`, type: "missing_docs_after", minutesSaved: 6, clientId: c.id, appointmentId: a.id, to: c.email,
        subject: "Just a few documents to finish your return",
        heading: "Almost done.",
        blocks: [{ p: `Hi ${first(c.name)}, thanks for coming in. To finish your return, Priya still needs:` }, { list: missing }, { button: { label: "Upload them here", href: portal } }],
      }));
    }
  }

  // Abandoned bookings: one nudge after 1 hour
  const { data: leads } = await s.from("leads").select("id, email, name, created_at")
    .eq("converted", false).is("nudged_at", null).lte("created_at", iso(t - nudgeH * H));
  for (const l of leads ?? []) {
    const sent = await sendMessage({
      dedupeKey: `nudge:${l.id}`, type: "abandoned_nudge", minutesSaved: 4, clientId: null, to: l.email,
      subject: "Your booking is saved",
      heading: "Pick up where you left off.",
      blocks: [{ p: `Hi${l.name ? ` ${first(l.name)}` : ""}, we saved your answers. Finishing takes less than a minute.` }, { button: { label: "Finish booking", href: `${origin}/book?resume=${l.id}` } }],
    });
    await s.from("leads").update({ nudged_at: now.toISOString() }).eq("id", l.id);
    hit("abandoned_nudge", sent);
  }

  // New season: January, last year's clients with no booking yet this year
  const year = Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", year: "numeric" }).format(now));
  const month = Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", month: "numeric" }).format(now));
  if (month === 1) {
    const { data: lastYear } = await s.from("appointments").select("client_id, clients(id, name, email)")
      .eq("status", "completed").gte("start_at", `${year - 1}-01-01`).lt("start_at", `${year}-01-01`);
    const { data: thisYear } = await s.from("appointments").select("client_id").gte("start_at", `${year}-01-01`).neq("status", "cancelled");
    const booked = new Set((thisYear ?? []).map((x) => x.client_id));
    const seen = new Set<string>();
    for (const r of lastYear ?? []) {
      const c = r.clients as { id: string; name: string; email: string } | null;
      if (!c || booked.has(c.id) || seen.has(c.id)) continue;
      seen.add(c.id);
      hit("new_season", await sendMessage({
        dedupeKey: `season:${year}:${c.id}`, type: "new_season", minutesSaved: 5, clientId: c.id, to: c.email,
        subject: `Tax season ${year}: book your spot`,
        heading: "A new tax season.",
        blocks: [{ p: `Hi ${first(c.name)}, it was good working with you last year. Spots fill quickly after February, so here's a direct link to book yours.` }, { button: { label: "Book your appointment", href: `${origin}/book/returning` } }],
      }));
    }
  }

  return { now: now.toISOString(), sent: counts };
}
