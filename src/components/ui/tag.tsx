import { cn } from "@/lib/utils";

/** The only badge in the product (DESIGN_SYSTEM v2 §6 "Tags/badges"): 18px pill, 11px, soft alert colors carry meaning. */
const TONE = {
  neutral: "border-line-1 bg-tint-0 text-[#424242]",
  success: "border-transparent bg-alert-success text-alert-success-fg",
  warning: "border-transparent bg-alert-warning text-alert-warning-fg",
  danger: "border-transparent bg-alert-negative text-alert-negative-fg",
  accent: "border-transparent bg-alert-info text-alert-info-fg",
} as const;
export type TagTone = keyof typeof TONE;

export function Tag({ tone = "neutral", className, children }: { tone?: TagTone; className?: string; children: React.ReactNode }) {
  return <span className={cn("inline-flex h-[18px] shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-1.5 text-[11px] font-medium leading-none", TONE[tone], className)}>{children}</span>;
}
