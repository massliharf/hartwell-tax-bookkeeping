import { cn } from "@/lib/utils";

/** A quiet slab-serif H, drawn as one shape rather than a badge or illustration. */
export function LogoMark({ size = 32, className, tone = "ink" }: { size?: number; className?: string; tone?: "ink" | "light" | "brand" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" className={cn("shrink-0", tone === "light" ? "text-primary-foreground" : "text-deep-ink", className)}>
      <path fill="currentColor" d="M4 5h13v3h-2.5v9h11V8H23V5h13v3h-2.5v24H36v3H23v-3h2.5v-9h-11v9H17v3H4v-3h2.5V8H4V5Z" />
    </svg>
  );
}

/** Mark + name. "stacked" shows what the business is under the name; "name" is the mark and name only. */
export function Logo({ size = 32, variant = "stacked", tone = "dark", className, sub = "Tax & Bookkeeping" }: {
  size?: number; variant?: "stacked" | "inline" | "name"; tone?: "dark" | "light"; className?: string; sub?: string;
}) {
  const name = tone === "dark" ? "text-deep-ink" : "text-primary-foreground";
  const muted = tone === "dark" ? "text-muted-foreground" : "text-primary-foreground/70";
  return (
    <span className={cn("flex min-w-0 items-center gap-2", className)}>
      <LogoMark size={size} tone={tone === "light" ? "light" : "ink"} />
      {variant === "stacked" && (
        <span className="flex min-w-0 flex-col leading-none">
          <span className={cn("font-serif text-[18px] font-semibold", name)}>Hartwell</span>
          <span className={cn("mt-1 truncate text-[10px] font-medium", muted)}>{sub}</span>
        </span>
      )}
      {variant === "inline" && (
        <span className="flex min-w-0 items-baseline gap-1.5">
          <span className={cn("font-serif text-[18px] font-semibold", name)}>Hartwell</span>
          <span className={cn("truncate text-[13px]", muted)}>{sub}</span>
        </span>
      )}
      {variant === "name" && <span className={cn("truncate font-serif text-[18px] font-semibold", name)}>Hartwell</span>}
    </span>
  );
}
