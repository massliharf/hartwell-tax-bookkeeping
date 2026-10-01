import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { DocumentStack, type StackDoc } from "@/components/brand/DocumentStack";
import { ReadyRing } from "@/components/brand/ReadyRing";
import { BellRing, CalendarCheck } from "lucide-react";

const ALL: StackDoc[] = [
  { id: "w2", title: "W-2", note: "Wages from your employer", received: true },
  { id: "1099", title: "1099-INT", note: "Bank interest", received: true },
  { id: "1098", title: "1098", note: "Mortgage interest", received: true },
];

export function HeroVisual() {
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (reduce) return;
    if (step >= 3) return; // play once, then rest
    const t = setTimeout(() => setStep((s) => s + 1), step === 0 ? 600 : 700);
    return () => clearTimeout(t);
  }, [step, reduce]);

  const shown = reduce ? 3 : Math.min(step, 3);
  const docs = [...ALL].reverse().map((doc, i) => ({ ...doc, received: i < shown }));

  return (
    <div className="relative mx-auto w-full max-w-sm pb-12 pt-12">
      <motion.div initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.3, ease: [0, 0, 0.2, 1] }} className="absolute -left-2 top-1 z-10 flex items-center gap-2 rounded-xl border border-border bg-sheet px-3 py-2 shadow-lift sm:-left-10">
        <span className="grid size-7 place-items-center rounded-lg bg-ink-50 text-ink"><CalendarCheck className="size-3.5" /></span>
        <span className="text-xs leading-4"><span className="block font-medium text-deep-ink">You're booked</span><span className="text-muted-foreground">Thursday, 10:30 am</span></span>
      </motion.div>
    <div className="relative w-full rounded-2xl border border-border bg-sheet p-5 shadow-lift sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-muted-foreground">Your checklist</p>
          <p className="mt-1 font-serif text-[20px] leading-tight text-deep-ink sm:text-2xl">Thursday, 10:30 am</p>
          <p className="text-xs text-muted-foreground">Individual return, 45 min</p>
        </div>
        <div className="shrink-0"><ReadyRing value={(shown / 3) * 100} size={72} stroke={6} /></div>
      </div>
      <div className="mt-5">
        <DocumentStack docs={docs} />
      </div>
    </div>
      <motion.div initial={reduce ? false : { opacity: 0, y: 6 }} animate={step >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }} transition={{ duration: 0.2, ease: [0, 0, 0.2, 1] }} className="absolute -right-2 bottom-0 z-10 flex items-center gap-2 rounded-xl border border-border bg-sheet px-3 py-2 shadow-lift sm:-right-8">
        <span className="grid size-7 place-items-center rounded-lg bg-fill-neutral text-deep-ink"><BellRing className="size-3.5" /></span>
        <span className="text-xs leading-4"><span className="block font-medium text-deep-ink">Claire checked everything</span><span className="text-muted-foreground">All documents in</span></span>
      </motion.div>
    </div>
  );
}
