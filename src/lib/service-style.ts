import { Briefcase, Building2, FileSpreadsheet, Home, Receipt, type LucideIcon } from "lucide-react";

/** One color + icon per service. Palette: oxblood, plum, sage, amber, slate (all used at 100% for icons, 10% for tiles)., used everywhere a service appears (DESIGN_SYSTEM.md: icon color at 100%, tile at 10%). */
export type ServiceStyle = { icon: LucideIcon; rgb: string };
const BY_SLUG: Record<string, ServiceStyle> = {
  individual: { icon: Receipt, rgb: "122,31,31" },
  "self-employed": { icon: Briefcase, rgb: "125,91,166" },
  rental: { icon: Home, rgb: "62,125,96" },
  extension: { icon: FileSpreadsheet, rgb: "196,128,20" },
  bookkeeping: { icon: Building2, rgb: "79,106,168" },
};
const NAME_TO_SLUG: Record<string, string> = {
  "individual return": "individual",
  "self-employed / freelancer": "self-employed",
  "rental property": "rental",
  "extension / irs letter review": "extension",
  "small business bookkeeping consult": "bookkeeping",
};
export function serviceStyle(slugOrName?: string | null): ServiceStyle {
  const key = (slugOrName ?? "").toLowerCase();
  return BY_SLUG[key] ?? BY_SLUG[NAME_TO_SLUG[key] ?? ""] ?? { icon: Receipt, rgb: "122,31,31" };
}
