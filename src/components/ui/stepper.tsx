import { cn } from "@/lib/utils";

/**
 * One progress indicator for the whole product (booking, the client's appointment page, Claire's appointment window).
 * Bars fill up to the current step; the current label is bold; on phones only the current label is shown.
 */
export function Stepper({ steps, current, className, label = "Progress" }: { steps: readonly string[]; current: number; className?: string; label?: string }) {
  return (
    <ol aria-label={label} className={cn("grid gap-1.5", className)} style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
      {steps.map((s, i) => (
        <li key={s} aria-current={i === current ? "step" : undefined}>
          <span className={cn("block h-1 rounded-full transition-colors duration-300", i <= current ? "bg-ink" : "bg-line-1")} />
          <span className={cn("mt-1.5 block text-[11px] leading-4", i === current ? "whitespace-nowrap font-medium text-deep-ink" : cn("truncate", i < current ? "text-deep-ink" : "text-muted-foreground", "max-sm:invisible"))}>{s}</span>
        </li>
      ))}
    </ol>
  );
}
