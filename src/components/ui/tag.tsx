import { cn } from "@/lib/utils";

/** The only badge in the product (DESIGN_SYSTEM.md "Metadata tag"): 20px, 4px radius, 11px text. Color only carries meaning. */
const TONE = {
  neutral: "border-[rgba(16,16,16,0.1)] bg-fill-subtle text-muted-foreground",
  success: "border-success/20 bg-success/10 text-success",
  warning: "border-warning/25 bg-warning/10 text-warning",
  danger: "border-destructive/20 bg-destructive/10 text-destructive",
  accent: "border-transparent bg-ink text-white",
} as const;
export type TagTone = keyof typeof TONE;

export function Tag({ tone = "neutral", className, children }: { tone?: TagTone; className?: string; children: React.ReactNode }) {
  return <span className={cn("inline-flex h-5 shrink-0 items-center gap-1 whitespace-nowrap rounded border px-1.5 text-[11px] font-medium leading-none", TONE[tone], className)}>{children}</span>;
}
