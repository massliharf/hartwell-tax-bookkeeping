import { cn } from "@/lib/utils";

/** Hartwell Tax brand mark: a rounded Hartwell-blue tile with a clean "H" monogram. */
export function LogoMark({ size = 32, className, tone = "brand" }: { size?: number; className?: string; tone?: "brand" | "white" }) {
  const bg = tone === "brand" ? "#2F54EB" : "#FFFFFF";
  const fg = tone === "brand" ? "#FFFFFF" : "#2F54EB";
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className={cn("shrink-0", className)}>
      <rect width="32" height="32" rx="9" fill={bg} />
      <path d="M10 8.5v15M22 8.5v15M10 16h12" stroke={fg} strokeWidth="3.2" strokeLinecap="round" />
    </svg>
  );
}

/** Mark + name. "stacked" shows the tagline under the name; "inline" keeps one line. */
export function Logo({ size = 32, variant = "stacked", tone = "dark", className, sub = "Tax & Bookkeeping" }: {
  size?: number; variant?: "stacked" | "inline" | "name"; tone?: "dark" | "light"; className?: string; sub?: string;
}) {
  const name = tone === "dark" ? "text-deep-ink" : "text-white";
  const muted = tone === "dark" ? "text-muted-foreground" : "text-white/60";
  return (
    <span className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <LogoMark size={size} />
      {variant === "stacked" && (
        <span className="flex min-w-0 flex-col leading-none">
          <span className={cn("font-serif text-[15px] font-semibold tracking-[-0.01em]", name)}>Hartwell</span>
          <span className={cn("mt-1 truncate text-[11px] font-medium", muted)}>{sub}</span>
        </span>
      )}
      {variant === "inline" && (
        <span className="flex min-w-0 items-baseline gap-1.5">
          <span className={cn("font-serif text-[15px] font-semibold tracking-[-0.01em]", name)}>Hartwell</span>
          <span className={cn("truncate text-[13px]", muted)}>{sub}</span>
        </span>
      )}
      {variant === "name" && <span className={cn("truncate font-serif text-[15px] font-semibold tracking-[-0.01em]", name)}>Hartwell</span>}
    </span>
  );
}
