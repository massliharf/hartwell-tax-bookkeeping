import { cn } from "@/lib/utils";

/**
 * Hartwell Tax mark: an official seal. Outer ring, inner ring, and an "H" whose crossbar is a ledger rule,
 * the kind of stamp an Enrolled Agent puts on a finished return. Ink, so it never competes with the action color.
 */
export function LogoMark({ size = 32, className, tone = "ink" }: { size?: number; className?: string; tone?: "ink" | "light" | "brand" }) {
  const fill = tone === "light" ? "#FFFFFF" : "#1C1714";
  const cut = tone === "light" ? "#1C1714" : "#FFFFFF";
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className={cn("shrink-0", className)}>
      <circle cx="16" cy="16" r="16" fill={fill} />
      <circle cx="16" cy="16" r="12.6" fill="none" stroke={cut} strokeWidth="1" strokeDasharray="1.4 1.6" />
      <path d="M11.4 10v12M20.6 10v12" stroke={cut} strokeWidth="2.6" strokeLinecap="round" />
      <path d="M11.4 15.3h9.2M11.4 17.6h9.2" stroke={cut} strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

/** Mark + name. "stacked" shows what the business is under the name; "name" is the mark and name only. */
export function Logo({ size = 32, variant = "stacked", tone = "dark", className, sub = "Tax & Bookkeeping" }: {
  size?: number; variant?: "stacked" | "inline" | "name"; tone?: "dark" | "light"; className?: string; sub?: string;
}) {
  const name = tone === "dark" ? "text-deep-ink" : "text-white";
  const muted = tone === "dark" ? "text-muted-foreground" : "text-white/60";
  return (
    <span className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <LogoMark size={size} tone={tone === "light" ? "light" : "ink"} />
      {variant === "stacked" && (
        <span className="flex min-w-0 flex-col leading-none">
          <span className={cn("font-serif text-[16px] font-semibold tracking-[-0.02em]", name)}>Hartwell Tax</span>
          <span className={cn("mt-1 truncate text-[11px]", muted)}>{sub}</span>
        </span>
      )}
      {variant === "inline" && (
        <span className="flex min-w-0 items-baseline gap-1.5">
          <span className={cn("font-serif text-[16px] font-semibold tracking-[-0.02em]", name)}>Hartwell Tax</span>
          <span className={cn("truncate text-[13px]", muted)}>{sub}</span>
        </span>
      )}
      {variant === "name" && <span className={cn("truncate font-serif text-[16px] font-semibold tracking-[-0.02em]", name)}>Hartwell Tax</span>}
    </span>
  );
}
