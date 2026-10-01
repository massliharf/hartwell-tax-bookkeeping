import { Briefcase, Building2, CalendarClock, FileSpreadsheet, Home, Mail, MessageCircle, Receipt, type LucideIcon } from "lucide-react";

/** One color + icon per service. Palette: oxblood, plum, sage, amber, slate (all used at 100% for icons, 10% for tiles)., used everywhere a service appears (DESIGN_SYSTEM.md: icon color at 100%, tile at 10%). */
export type ServiceStyle = { icon: LucideIcon; rgb: string };
const BY_SLUG: Record<string, ServiceStyle> = {
  individual: { icon: Receipt, rgb: "122,31,31" },
  "self-employed": { icon: Briefcase, rgb: "125,91,166" },
  rental: { icon: Home, rgb: "62,125,96" },
  extension: { icon: FileSpreadsheet, rgb: "196,128,20" },
  bookkeeping: { icon: Building2, rgb: "79,106,168" },
  intro: { icon: MessageCircle, rgb: "30,107,69" },
  letter: { icon: Mail, rgb: "179,38,30" },
  planning: { icon: CalendarClock, rgb: "20,112,118" },
};
const NAME_TO_SLUG: Record<string, string> = {
  "individual return": "individual",
  "self-employed / freelancer": "self-employed",
  "rental property": "rental",
  "extension / irs letter review": "extension",
  "small business bookkeeping consult": "bookkeeping",
  "small business bookkeeping": "bookkeeping",
  "free 15-minute call": "intro",
  "irs or state letter": "letter",
  "extension or late return": "extension",
  "tax planning and quarterly estimates": "planning",
};
export function serviceStyle(slugOrName?: string | null): ServiceStyle {
  const key = (slugOrName ?? "").toLowerCase();
  return BY_SLUG[key] ?? BY_SLUG[NAME_TO_SLUG[key] ?? ""] ?? { icon: Receipt, rgb: "122,31,31" };
}
