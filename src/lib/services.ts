export type ServiceGroup = "start" | "returns" | "problems" | "year";
export type Service = { id: string; name: string; blurb: string; minutes: number; price: number; from: boolean; group: ServiceGroup; note?: string; includes?: string };

/** Mirrors public.services (sql/services-v2.sql). The database is the source for availability and booking; this adds the words. */
export const SERVICES: Service[] = [
  { id: "intro", name: "Free 15-minute call", blurb: "Not sure what you need? Talk it through with Claire.", minutes: 15, price: 0, from: false, group: "start", includes: "By video, or by phone if you prefer. No documents needed." },
  { id: "individual", name: "Individual return", blurb: "W-2s, mortgage, kids, student loans.", minutes: 45, price: 250, from: true, group: "returns", note: "+ $50 per extra state", includes: "Federal and New Jersey, e-filed, and a year of questions." },
  { id: "self-employed", name: "Self-employed / freelancer", blurb: "1099s, business expenses, home office.", minutes: 75, price: 450, from: true, group: "returns", note: "+ $50 per extra state", includes: "Schedule C and self-employment tax, federal and New Jersey, e-filed." },
  { id: "rental", name: "Rental property", blurb: "Rent, repairs and depreciation.", minutes: 60, price: 400, from: true, group: "returns", note: "+ $75 per extra property", includes: "Your full return with Schedule E and depreciation, e-filed." },
  { id: "letter", name: "IRS or state letter", blurb: "A notice from the IRS or New Jersey.", minutes: 30, price: 150, from: false, group: "problems", includes: "We read it, explain it and tell you what to do next. Replying for you is quoted separately." },
  { id: "extension", name: "Extension or late return", blurb: "More time to file, or past years.", minutes: 45, price: 200, from: true, group: "problems", note: "$200 per past year", includes: "Extension filed the same day. Past years are prepared and e-filed where the IRS allows." },
  { id: "planning", name: "Tax planning and quarterly estimates", blurb: "Know what to set aside, and when.", minutes: 45, price: 175, from: false, group: "year", includes: "Your four quarterly amounts and due dates, and a plan to avoid a surprise bill." },
  { id: "bookkeeping", name: "Small business bookkeeping", blurb: "Set up simple books, or fix messy ones.", minutes: 60, price: 200, from: false, group: "year", includes: "A simple setup you can keep up yourself, or a cleanup plan with a quote." },
];

export const GROUPS: { id: ServiceGroup; title: string; sub: string }[] = [
  { id: "returns", title: "Tax returns", sub: "Prepared and e-filed. Federal and NJ included." },
  { id: "problems", title: "Letters and deadlines", sub: "When something needs sorting out." },
  { id: "year", title: "All year", sub: "Planning and bookkeeping." },
];
export const serviceInfo = (slug?: string | null) => SERVICES.find((x) => x.id === slug);
export const isIntro = (slug?: string | null) => slug === "intro";

export const HOURS = [
  { days: "Monday – Friday", time: "9:00 am – 6:00 pm" },
  { days: "Saturday", time: "10:00 am – 2:00 pm" },
  { days: "Sunday", time: "Closed" },
];
