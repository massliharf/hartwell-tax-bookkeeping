import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, FileText } from "lucide-react";

export type StackDoc = { id: string; title: string; note: string; received: boolean };

/** Signature "document stack" — documents stacking up with a check as they arrive. */
export function DocumentStack({ docs }: { docs: StackDoc[] }) {
  const reduce = useReducedMotion();
  return (
    <ul className="flex flex-col gap-2.5">
      <AnimatePresence initial={false}>
        {docs.map((d) => (
          <motion.li
            key={d.id}
            layout={!reduce}
            initial={reduce ? false : { opacity: 0, y: -18, rotate: -1.5, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className="flex items-center gap-3 rounded-xl border border-border bg-sheet px-3.5 py-3 shadow-sheet"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-sage text-ink">
              <FileText className="size-4" strokeWidth={1.75} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-deep-ink">{d.title}</span>
              <span className="block truncate text-xs text-muted-foreground">{d.note}</span>
            </span>
            <span className="relative grid size-6 shrink-0 place-items-center rounded-full border border-border">
              <AnimatePresence>
                {d.received && (
                  <motion.span
                    initial={reduce ? false : { scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 18, delay: 0.15 }}
                    className="absolute inset-0 grid place-items-center rounded-full bg-success text-paper"
                  >
                    <Check className="size-3.5" strokeWidth={3} />
                  </motion.span>
                )}
              </AnimatePresence>
            </span>
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}
