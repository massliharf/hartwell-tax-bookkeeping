import { Briefcase, Building2, FileSpreadsheet, Home, Receipt, type LucideIcon } from "lucide-react";

/** One color + icon per service, used everywhere a service appears (DESIGN_SYSTEM.md: icon color at 100%, tile at 10%). */
export type ServiceStyle = { icon: LucideIcon; rgb: string };
const BY_SLUG: Record<string, ServiceStyle> = {
  individual: { icon: Receipt, rgb: "79,105,242" },
  "self-employed": { icon: Briefcase, rgb: "133,102,220" },
  rental: { icon: Home, rgb: "30,91,71" },
  extension: { icon: FileSpreadsheet, rgb: "196,120,44" },
  bookkeeping: { icon: Building2, rgb: "33,124,150" },
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
  return BY_SLUG[key] ?? BY_SLUG[NAME_TO_SLUG[key] ?? ""] ?? { icon: Receipt, rgb: "30,91,71" };
}
