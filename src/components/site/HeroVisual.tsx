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
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const t = setTimeout(() => setStep((s) => (s >= 5 ? 0 : s + 1)), step === 0 ? 700 : step >= 3 ? 2200 : 1300);
    return () => clearTimeout(t);
  }, [step, reduce]);

  const shown = reduce ? 3 : Math.min(step, 3);
  const docs = [...ALL].reverse().map((doc, i) => ({ ...doc, received: i < shown }));

  return (
    <div className="relative mx-auto h-[340px] w-full max-w-sm rounded-2xl border border-border bg-sheet p-5 shadow-[0_0_2px_rgba(18,18,18,.08),0_2px_4px_rgba(18,18,18,.08),0_6px_6px_rgba(18,18,18,.04),0_14px_9px_rgba(18,18,18,.02),0_25px_10px_rgba(18,18,18,.02)] sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-muted-foreground">Your checklist</p>
          <p className="mt-1 whitespace-nowrap font-serif text-[clamp(16px,5vw,24px)] leading-tight text-deep-ink">Thursday, 10:30 am</p>
          <p className="text-xs text-muted-foreground">Individual return, 45 min</p>
        </div>
        <div className="shrink-0"><ReadyRing value={(shown / 3) * 100} size={84} stroke={6} /></div>
      </div>
      <div className="mt-5">
        <DocumentStack docs={docs} />
      </div>
      <p className={`mt-3 text-center text-xs font-medium ${shown === 3 ? "text-success" : "invisible"}`}>
        All set. Claire has checked everything.
      </p>
    </div>
  );
}
