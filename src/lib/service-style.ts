import { Briefcase, Building2, FileSpreadsheet, Home, Receipt, type LucideIcon } from "lucide-react";

/** One color + icon per service. Palette: blue, violet, teal, amber, rose (all used at 100% for icons, 10% for tiles)., used everywhere a service appears (DESIGN_SYSTEM.md: icon color at 100%, tile at 10%). */
export type ServiceStyle = { icon: LucideIcon; rgb: string };
const BY_SLUG: Record<string, ServiceStyle> = {
  individual: { icon: Receipt, rgb: "47,84,235" },
  "self-employed": { icon: Briefcase, rgb: "124,92,219" },
  rental: { icon: Home, rgb: "13,148,136" },
  extension: { icon: FileSpreadsheet, rgb: "217,119,6" },
  bookkeeping: { icon: Building2, rgb: "204,95,125" },
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
  return BY_SLUG[key] ?? BY_SLUG[NAME_TO_SLUG[key] ?? ""] ?? { icon: Receipt, rgb: "47,84,235" };
}
