// Intake questions per service + a client-side mirror of document_rules for the live preview.
export type Answers = {
  w2_count?: number | undefined;
  freelance?: boolean | undefined;
  interest?: boolean | undefined;
  mortgage?: boolean | undefined;
  student_loans?: boolean | undefined;
  dependents?: boolean | undefined;
  rental?: boolean | undefined;
  irs_letter?: boolean | undefined;
  filed_with_us?: boolean | undefined;
};
export type Question = { key: keyof Answers; label: string; hint?: string; type: "yesno" | "count" };

const Q: Record<string, Question> = {
  w2_count: { key: "w2_count", label: "How many W-2 jobs did you have?", hint: "Count every employer this year.", type: "count" },
  freelance: { key: "freelance", label: "Any freelance or side income?", type: "yesno" },
  interest: { key: "interest", label: "Did you earn bank interest?", type: "yesno" },
  mortgage: { key: "mortgage", label: "Do you pay a mortgage?", type: "yesno" },
  student_loans: { key: "student_loans", label: "Paying student loans?", type: "yesno" },
  dependents: { key: "dependents", label: "Kids or childcare costs?", type: "yesno" },
  irs_letter: { key: "irs_letter", label: "Did you get a letter from the IRS?", type: "yesno" },
  filed_with_us: { key: "filed_with_us", label: "Did you file with us last year?", type: "yesno" },
};

const BY_SERVICE: Record<string, (keyof typeof Q)[]> = {
  individual: ["w2_count", "mortgage", "student_loans", "dependents", "filed_with_us"],
  "self-employed": ["w2_count", "mortgage", "dependents", "filed_with_us"],
  rental: ["w2_count", "mortgage", "filed_with_us"],
  extension: ["w2_count", "freelance", "irs_letter", "filed_with_us"],
  bookkeeping: ["w2_count", "interest", "filed_with_us"],
};

export const questionsFor = (slug?: string | null): Question[] => (BY_SERVICE[slug ?? ""] ?? BY_SERVICE["individual"]!).map((k) => Q[k]!);

export function impliedFlags(slug?: string | null): Partial<Answers> {
  if (slug === "self-employed" || slug === "bookkeeping") return { freelance: true };
  if (slug === "rental") return { rental: true };
  return {};
}

const employerLabels = (n: number) => (n <= 1 ? (n === 1 ? ["your employer"] : []) : Array.from({ length: n }, (_, i) => `employer #${i + 1}`));

export type PreviewDoc = { id: string; title: string; note: string };

export function previewChecklist(slug: string | null | undefined, answers: Answers): PreviewDoc[] {
  const a = { ...answers, ...impliedFlags(slug) };
  const docs: PreviewDoc[] = [{ id: "id", title: "Photo ID", note: "A clear phone photo is fine" }];
  if (a.filed_with_us === false) docs.push({ id: "prior", title: "Last year's tax return", note: "Federal and state" });
  employerLabels(a.w2_count ?? 0).forEach((e, i) => docs.push({ id: `w2-${i}`, title: `W-2 from ${e}`, note: "Sent in January" }));
  if (a.freelance) {
    docs.push({ id: "1099", title: "1099-NEC or 1099-K", note: "From clients or payment apps" });
    docs.push({ id: "ie", title: "Income & expense summary", note: "A simple list is fine" });
    docs.push({ id: "ho", title: "Home office details", note: "Optional" });
  }
  if (a.interest) docs.push({ id: "int", title: "1099-INT", note: "From your bank" });
  if (a.mortgage) docs.push({ id: "1098", title: "1098 mortgage interest statement", note: "From your lender" });
  if (a.student_loans) docs.push({ id: "1098e", title: "1098-E", note: "Student loan interest" });
  if (a.dependents) docs.push({ id: "care", title: "Childcare provider info and costs", note: "Name, tax ID, total paid" });
  if (a.rental) {
    docs.push({ id: "rent", title: "Rental income & expenses", note: "Rent, repairs, insurance" });
    docs.push({ id: "ptax", title: "Property tax bill", note: "For the rental" });
  }
  if (slug === "extension") {
    docs.push({ id: "irs", title: "The IRS letter", note: "Every page" });
    if (a.filed_with_us !== false) docs.push({ id: "prior2", title: "Prior year return", note: "The one in question" });
  }
  return docs;
}

/** Shape stored as appointments.intake_answers (read by generate_checklist). */
export function toIntakePayload(slug: string, answers: Answers) {
  const a = { ...answers, ...impliedFlags(slug) };
  return {
    w2_employers: employerLabels(a.w2_count ?? 0),
    freelance: !!a.freelance,
    interest: !!a.interest,
    mortgage: !!a.mortgage,
    student_loans: !!a.student_loans,
    dependents: !!a.dependents,
    rental: !!a.rental,
    irs_letter: !!a.irs_letter,
    filed_with_us: !!a.filed_with_us,
  };
}

/** Reverse of toIntakePayload, for returning clients. */
export function fromIntakePayload(p: Record<string, unknown>): Answers {
  const emps = Array.isArray(p["w2_employers"]) ? p["w2_employers"].length : 0;
  const b = (k: string) => (typeof p[k] === "boolean" ? (p[k] as boolean) : undefined);
  return {
    w2_count: emps, freelance: b("freelance"), interest: b("interest"), mortgage: b("mortgage"),
    student_loans: b("student_loans"), dependents: b("dependents"), rental: b("rental"),
    irs_letter: false, filed_with_us: true,
  };
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
