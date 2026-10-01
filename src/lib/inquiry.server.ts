import { SERVICES, HOURS } from "./services";
import { OFFICE_ADDRESS, OFFICE_PHONE, OFFICE_EMAIL } from "./meeting";

const FACTS = () => [
  `Practice: Hartwell Tax & Bookkeeping, Claire Hartwell, EA (IRS Enrolled Agent), ${OFFICE_ADDRESS}. Phone ${OFFICE_PHONE}, email ${OFFICE_EMAIL}.`,
  `Hours: ${JSON.stringify(HOURS)} (America/New_York). Open all year; busiest Feb to mid-April and before October 15.`,
  "Services:",
  ...SERVICES.map((s) => `- ${s.name}: ${s.minutes} min, ${s.price === 0 ? "free" : `${s.from ? "from " : ""}$${s.price}`}. ${s.blurb}`),
  "Booking is online and confirmed instantly; no payment to book, you pay after the work is done. In person or video. After booking, a few questions create an exact document checklist; documents are uploaded privately from a phone. Federal, NJ and NY non-resident returns. Reschedule or cancel any time from the confirmation email link.",
].join("\n");

/** Decide whether a question is a simple practical one we can answer, and draft a reply either way. */
export async function classifyInquiry(question: string, origin: string): Promise<{ auto: boolean; reply: string | null }> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) return { auto: false, reply: null };
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: `You answer website questions for a small tax practice, writing as Claire. Facts:\n${FACTS()}\nBooking page: ${origin}/book\n\nRules: auto=true ONLY for practical questions fully answered by the facts (prices, hours, location, services offered, how booking/documents/payment/video work). auto=false for anything about the person's own tax situation, tax advice, IRS letters/notices, complaints, refunds status, or anything uncertain. Never give tax advice. Never ask for a Social Security number or account numbers. Reply: short, warm, plain English, 2-4 sentences, no greeting line or signature, mention the booking page when helpful. For auto=false still write a helpful draft reply Claire can edit.` },
          { role: "user", content: question },
        ],
        tools: [{ type: "function", function: { name: "answer", parameters: { type: "object", properties: { auto: { type: "boolean" }, reply: { type: "string" } }, required: ["auto", "reply"] } } }],
        tool_choice: { type: "function", function: { name: "answer" } },
      }),
    });
    if (!res.ok) { console.error("Inquiry AI failed", res.status, await res.text()); return { auto: false, reply: null }; }
    const j = await res.json();
    const a = JSON.parse(j.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments ?? "{}");
    const reply = typeof a.reply === "string" && a.reply.trim() ? a.reply.trim().slice(0, 1500) : null;
    return { auto: a.auto === true && !!reply, reply };
  } catch (e) { console.error("Inquiry AI error", e); return { auto: false, reply: null }; }
}

export async function sendInquiryReply(id: string, to: string, name: string, question: string, reply: string, origin: string, minutes: number) {
  const { sendMessage } = await import("./email.server");
  const first = name.split(" ")[0] || name;
  await sendMessage({
    dedupeKey: `inquiry:${id}:${Date.now()}`, type: "inquiry_reply", minutesSaved: minutes, clientId: null, to,
    subject: "About your question", heading: `Hi ${first},`,
    blocks: [
      ...reply.split(/\n{2,}/).map((p) => ({ p })),
      { button: { label: "See open times", href: `${origin}/book` } },
      { note: `You asked: "${question.slice(0, 300)}"` },
    ],
  });
}
