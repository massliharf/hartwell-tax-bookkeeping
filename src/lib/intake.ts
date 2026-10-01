// Intake questions per service + a client-side mirror of document_rules for the live preview.
export type Answers = {
  w2_count?: number | undefined;
  filed_with_us?: boolean | undefined;
  none_apply?: boolean | undefined;
  freelance?: boolean | undefined;
  interest?: boolean | undefined;
  investments?: boolean | undefined;
  retirement?: boolean | undefined;
  social_security?: boolean | undefined;
  unemployment?: boolean | undefined;
  mortgage?: boolean | undefined;
  student_loans?: boolean | undefined;
  dependents?: boolean | undefined;
  tuition?: boolean | undefined;
  marketplace?: boolean | undefined;
  hsa?: boolean | undefined;
  donations?: boolean | undefined;
  nj_rent?: boolean | undefined;
  nj_homeowner?: boolean | undefined;
  estimated?: boolean | undefined;
  rental?: boolean | undefined;
  irs_letter?: boolean | undefined;
};
export type ChipKey = Exclude<keyof Answers, "w2_count" | "filed_with_us" | "none_apply" | "irs_letter">;
export type Question = { key: keyof Answers; label: string; hint?: string; type: "yesno" | "count" };

const Q: Record<string, Question> = {
  w2_count: { key: "w2_count", label: "How many W-2 jobs did you have?", type: "count" },
  filed_with_us: { key: "filed_with_us", label: "Did you file with us last year?", type: "yesno" },
};

/** Things that change which documents you need. Short labels; each one maps to document_rules.condition. */
export const CHIPS: Record<ChipKey, string> = {
  interest: "Bank interest or dividends",
  investments: "Sold stocks or crypto",
  retirement: "Retirement income or 401(k)",
  social_security: "Social Security",
  unemployment: "Unemployment",
  freelance: "Side or freelance income",
  rental: "Rental income",
  mortgage: "Mortgage",
  student_loans: "Student loans",
  dependents: "Kids or childcare",
  tuition: "College tuition",
  marketplace: "Marketplace health insurance",
  hsa: "HSA",
  donations: "Donations",
  nj_rent: "Rented in NJ",
  nj_homeowner: "Own a home in NJ",
  estimated: "Paid estimated taxes",
};

const INDIVIDUAL: ChipKey[] = ["interest", "investments", "retirement", "social_security", "unemployment", "freelance", "mortgage", "student_loans", "dependents", "tuition", "marketplace", "hsa", "donations", "nj_rent", "nj_homeowner", "estimated"];
const BY_SERVICE: Record<string, { questions: (keyof typeof Q)[]; chips: ChipKey[] }> = {
  individual: { questions: ["w2_count", "filed_with_us"], chips: INDIVIDUAL },
  "self-employed": { questions: ["w2_count", "filed_with_us"], chips: INDIVIDUAL.filter((k) => k !== "freelance" && k !== "unemployment") },
  rental: { questions: ["w2_count", "filed_with_us"], chips: ["interest", "investments", "retirement", "social_security", "freelance", "mortgage", "dependents", "marketplace", "donations", "nj_homeowner", "estimated"] },
  extension: { questions: ["w2_count", "filed_with_us"], chips: INDIVIDUAL },
  letter: { questions: ["filed_with_us"], chips: [] },
  planning: { questions: ["w2_count", "filed_with_us"], chips: ["freelance", "rental", "investments", "retirement", "estimated"] },
  bookkeeping: { questions: ["filed_with_us"], chips: ["interest", "rental", "estimated"] },
  intro: { questions: [], chips: [] },
};
const plan = (slug?: string | null) => BY_SERVICE[slug ?? ""] ?? BY_SERVICE["individual"]!;

export const questionsFor = (slug?: string | null): Question[] => plan(slug).questions.map((k) => Q[k]!);
export const chipsFor = (slug?: string | null): ChipKey[] => plan(slug).chips;

/** Answered enough to build the list: every question, and either a chip or "None of these". */
export function intakeComplete(slug: string | null | undefined, a: Answers) {
  const qsDone = questionsFor(slug).every((q) => (q.type === "count" ? true : typeof a[q.key] === "boolean"));
  const chips = chipsFor(slug);
  return qsDone && (chips.length === 0 || !!a.none_apply || chips.some((k) => a[k] === true));
}

export function impliedFlags(slug?: string | null): Partial<Answers> {
  if (slug === "self-employed" || slug === "bookkeeping") return { freelance: true };
  if (slug === "rental") return { rental: true };
  return {};
}

const employerLabels = (n: number) => (n <= 1 ? (n === 1 ? ["your employer"] : []) : Array.from({ length: n }, (_, i) => `employer #${i + 1}`));

export type PreviewDoc = { id: string; title: string; note: string };

export function previewChecklist(slug: string | null | undefined, answers: Answers): PreviewDoc[] {
  if (slug === "intro") return [];
  const a = { ...answers, ...impliedFlags(slug) };
  const docs: PreviewDoc[] = [{ id: "id", title: "Photo ID", note: "A clear phone photo is fine" }];
  if (a.filed_with_us === false) docs.push({ id: "prior", title: "Last year's tax return", note: "Federal and state" });
  employerLabels(a.w2_count ?? 0).forEach((e, i) => docs.push({ id: `w2-${i}`, title: `W-2 from ${e}`, note: "Sent in January" }));
  if (a.freelance) {
    docs.push({ id: "1099", title: "1099-NEC or 1099-K", note: "From clients or payment apps" });
    docs.push({ id: "ie", title: "Income & expense summary", note: "A simple list is fine" });
    docs.push({ id: "ho", title: "Home office details", note: "Optional" });
  }
  if (a.interest) { docs.push({ id: "int", title: "1099-INT", note: "From your bank" }); docs.push({ id: "div", title: "1099-DIV", note: "Dividends" }); }
  if (a.investments) { docs.push({ id: "b", title: "1099-B", note: "From your brokerage" }); docs.push({ id: "crypto", title: "Crypto transaction report", note: "If you traded crypto" }); }
  if (a.retirement) docs.push({ id: "r", title: "1099-R", note: "Pension, IRA or 401(k)" });
  if (a.social_security) docs.push({ id: "ssa", title: "SSA-1099", note: "Social Security benefits" });
  if (a.unemployment) docs.push({ id: "g", title: "1099-G", note: "Unemployment benefits" });
  if (a.mortgage) docs.push({ id: "1098", title: "1098 mortgage interest statement", note: "From your lender" });
  if (a.student_loans) docs.push({ id: "1098e", title: "1098-E", note: "Student loan interest" });
  if (a.dependents) docs.push({ id: "care", title: "Childcare provider info and costs", note: "Name, tax ID, total paid" });
  if (a.tuition) docs.push({ id: "t", title: "1098-T", note: "Tuition statement" });
  if (a.marketplace) docs.push({ id: "a", title: "1095-A", note: "Needed to file" });
  if (a.hsa) docs.push({ id: "hsa", title: "5498-SA and 1099-SA", note: "From your HSA provider" });
  if (a.donations) docs.push({ id: "don", title: "Donation receipts", note: "Optional" });
  if (a.nj_rent) docs.push({ id: "rent-nj", title: "Rent you paid this year", note: "Total and landlord's name" });
  if (a.nj_homeowner) docs.push({ id: "ptax-home", title: "Property tax bill for your home", note: "Latest bill" });
  if (a.estimated) docs.push({ id: "est", title: "Estimated tax payments", note: "Dates and amounts" });
  if (a.rental) {
    docs.push({ id: "rent", title: "Rental income & expenses", note: "Rent, repairs, insurance" });
    docs.push({ id: "ptax", title: "Property tax bill", note: "For the rental" });
  }
  if (slug === "letter") {
    docs.push({ id: "letter", title: "The letter", note: "Every page, front and back" });
    docs.push({ id: "letter-ret", title: "The return the letter is about", note: "If you have it" });
  }
  if (slug === "extension") docs.push({ id: "years", title: "Income documents for each year you need to file", note: "W-2s and 1099s for those years" });
  if (slug === "planning") docs.push({ id: "ytd", title: "Year-to-date income and expenses", note: "Pay stubs, invoices or a summary" });
  return docs;
}

/** Shape stored as appointments.intake_answers (read by generate_checklist). */
export function toIntakePayload(slug: string, answers: Answers) {
  const a = { ...answers, ...impliedFlags(slug) };
  const flags = Object.fromEntries((Object.keys(CHIPS) as ChipKey[]).map((k) => [k, !!a[k]]));
  return { w2_employers: employerLabels(a.w2_count ?? 0), ...flags, irs_letter: !!a.irs_letter, filed_with_us: !!a.filed_with_us };
}

/** Reverse of toIntakePayload, for returning clients. */
export function fromIntakePayload(p: Record<string, unknown>): Answers {
  const emps = Array.isArray(p["w2_employers"]) ? p["w2_employers"].length : 0;
  const out: Answers = { w2_count: emps, irs_letter: false, filed_with_us: true };
  for (const k of Object.keys(CHIPS) as ChipKey[]) if (typeof p[k] === "boolean") out[k] = p[k] as boolean;
  return out;
}

export const TZ = "America/New_York";
export const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString("en-US", { timeZone: TZ, hour: "numeric", minute: "2-digit" });
export const fmtDateLong = (iso: string) => new Date(iso).toLocaleDateString("en-US", { timeZone: TZ, weekday: "long", month: "long", day: "numeric" });
export const fmtDayChip = (ymd: string) => {
  const d = new Date(`${ymd}T12:00:00Z`);
  return {
    dow: d.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }),
    day: d.toLocaleDateString("en-US", { day: "numeric", timeZone: "UTC" }),
    month: d.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }),
  };
};
