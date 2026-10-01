import { motion, useReducedMotion } from "framer-motion";
import { Check, FileText } from "lucide-react";

export type StackDoc = { id: string; title: string; note: string; received: boolean };

/** Signature "document stack" — documents stacking up with a check as they arrive. */
export function DocumentStack({ docs }: { docs: StackDoc[] }) {
  const reduce = useReducedMotion();
  return (
     <ul className="flex flex-col gap-1.5">
        {docs.map((d) => (
          <li
            key={d.id}
             className="flex items-center gap-2.5 rounded-lg border border-border bg-sheet px-3 py-2"
          >
             <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-fill-neutral text-deep-ink">
              <FileText className="size-4" strokeWidth={1.75} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-deep-ink">{d.title}</span>
              <span className="block truncate text-xs text-muted-foreground">{d.note}</span>
            </span>
            <span className="relative grid size-6 shrink-0 place-items-center rounded-full border border-border">
              <motion.span initial={false} animate={{ scale: d.received ? 1 : 0 }} transition={{ duration: reduce ? 0 : 0.15 }} className="absolute inset-0 grid place-items-center rounded-full bg-success text-primary-foreground">
                <Check className="size-3.5" strokeWidth={3} />
              </motion.span>
            </span>
          </li>
        ))}
    </ul>
  );
}
