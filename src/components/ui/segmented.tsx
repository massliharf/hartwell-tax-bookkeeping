import { motion, useReducedMotion } from "framer-motion";
import { useId, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** DESIGN_SYSTEM.md segmented control: #EDEDED track, 4px inset, sliding #FFFFFF indicator (200ms). */
export function Segmented<T extends string>({ value, onChange, options, label, className, size = "md" }: {
  value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode }[]; label: string; className?: string; size?: "md" | "sm";
}) {
  const id = useId();
  const reduce = useReducedMotion();
  return (
    <div role="radiogroup" aria-label={label} className={cn("inline-flex gap-1 overflow-x-auto rounded-lg bg-fill-neutral p-1 [scrollbar-width:none]", className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button key={o.value} type="button" role="radio" aria-checked={active} onClick={() => onChange(o.value)}
            className={cn("relative inline-flex min-w-10 shrink-0 items-center justify-center gap-2 rounded-md px-3 font-medium transition-colors duration-150", size === "md" ? "h-9 text-[13px] sm:h-7 sm:text-xs" : "h-9 text-xs sm:h-7 sm:text-xs", active ? "text-deep-ink" : "text-muted-foreground hover:text-deep-ink")}>
            {active && <motion.span layoutId={`seg-${id}`} transition={reduce ? { duration: 0 } : { duration: 0.2, ease: [0.4, 0, 0.2, 1] }} className="absolute inset-0 rounded-md bg-sheet shadow-[0_1px_2px_rgba(16,16,16,0.08)]" />}
            <span className="relative inline-flex items-center gap-2 [&_svg]:size-3.5">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
