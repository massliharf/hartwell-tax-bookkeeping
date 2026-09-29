import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { DocumentStack, type StackDoc } from "@/components/brand/DocumentStack";
import { ReadyRing } from "@/components/brand/ReadyRing";

const ALL: StackDoc[] = [
  { id: "w2", title: "W-2", note: "Wages from your employer", received: true },
  { id: "1099", title: "1099-INT", note: "Bank interest", received: true },
  { id: "1098", title: "1098", note: "Mortgage interest", received: true },
];

export function HeroVisual() {
  const reduce = useReducedMotion();
  const [step, setStep] = useState(3);

  useEffect(() => {
    if (reduce) return;
    const t = setTimeout(() => setStep((s) => (s >= 5 ? 1 : s + 1)), step >= 3 ? 2200 : 1300);
    return () => clearTimeout(t);
  }, [step, reduce]);

  const shown = Math.min(step, 3);
  const docs = ALL.slice(0, shown).reverse();

  return (
    <div className="sheet-stack relative mx-auto w-full max-w-sm p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Your checklist</p>
          <p className="mt-1 font-sans text-2xl leading-tight text-deep-ink">Thursday, 10:30 am</p>
          <p className="text-xs text-muted-foreground">Individual return · 45 min</p>
        </div>
        <ReadyRing value={(shown / 3) * 100} size={84} stroke={6} />
      </div>
      <div className="mt-5 min-h-[212px]">
        <DocumentStack docs={docs} />
        {shown === 0 && (
          <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-xs text-muted-foreground">Waiting for your documents…</p>
        )}
      </div>
      <p className={`mt-3 text-center text-xs font-medium transition-opacity duration-500 ${shown === 3 ? "text-success opacity-100" : "opacity-0"}`}>
        All set. Priya has checked everything.
      </p>
    </div>
  );
}
