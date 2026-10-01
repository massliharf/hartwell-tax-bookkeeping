import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CalendarCheck, Check } from "lucide-react";
import { ServiceIcon } from "@/components/brand/ServiceIcon";
import { ReadyRing } from "@/components/brand/ReadyRing";
import { serviceStyle } from "@/lib/service-style";

/**
 * The hero shows what each service actually produces, one at a time: a return getting ready, an IRS letter
 * being answered, an extension filed, a year of quarterly payments planned, books reconciled.
 * It cycles every few seconds (pausing on hover or focus); the tabs let a visitor pick one. Reduced motion: static.
 */
type Scene = { id: string; tab: string; kicker: string; title: string; sub: string; rows: [string, string][]; done: string };
const SCENES: Scene[] = [
  { id: "individual", tab: "Tax return", kicker: "Your document checklist", title: "Thursday, 10:30 AM", sub: "Individual return, 45 min", rows: [["W-2", "Wages from your employer"], ["1099-INT", "Bank interest"], ["1098", "Mortgage interest"]], done: "All documents in" },
  { id: "letter", tab: "IRS letter", kicker: "Notice CP2000", title: "Sorted in one call", sub: "IRS letter review, 30 min", rows: [["Letter uploaded", "All 4 pages"], ["Explained", "A missing 1099 from 2024"], ["Reply sent", "Before the IRS deadline"]], done: "Nothing owed" },
  { id: "extension", tab: "Extension", kicker: "2025 return", title: "Filed by October 15", sub: "Extension or late return", rows: [["Extension filed", "Same day, April 14"], ["Documents in", "Uploaded in September"], ["Return filed", "October 9"]], done: "On time, no penalty" },
  { id: "planning", tab: "Tax planning", kicker: "Quarterly estimates", title: "$2,340 a quarter", sub: "Tax planning, 45 min", rows: [["April 15", "Q1 paid"], ["June 15", "Q2 paid"], ["September 15", "Q3 paid"]], done: "No surprise bill" },
  { id: "bookkeeping", tab: "Bookkeeping", kicker: "October books", title: "Reconciled", sub: "Small business bookkeeping", rows: [["Bank and card feeds", "214 transactions"], ["Categorized", "Supplies, rent, software"], ["Ready for taxes", "Profit and loss report"]], done: "Books up to date" },
];

export function HeroVisual() {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  const [tick, setTick] = useState(reduce ? 3 : 0);
  const [paused, setPaused] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const s = SCENES[i]!;
  const rgb = serviceStyle(s.id).rgb;

  // Rows tick in, then the scene rests, then the next service.
  useEffect(() => {
    if (reduce || paused) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (tick < 3) setTick((t) => t + 1);
      else { setI((n) => (n + 1) % SCENES.length); setTick(0); }
    }, tick === 0 ? 500 : tick < 3 ? 550 : 2200);
    return () => clearTimeout(timer.current);
  }, [tick, i, reduce, paused]);

  const pick = (n: number) => { setI(n); setTick(reduce ? 3 : 0); };
  const shown = reduce ? 3 : tick;

  return (
    <div className="relative mx-auto w-full max-w-sm pb-10 pt-12" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
      {/* Service tabs: the five services, one tap each. */}
      <div role="tablist" aria-label="What we do" className="absolute inset-x-0 top-0 z-10 flex justify-center gap-1">
        {SCENES.map((x, n) => {
          const on = n === i; const c = serviceStyle(x.id).rgb;
          return (
            <button key={x.id} type="button" role="tab" aria-selected={on} aria-label={x.tab} onClick={() => pick(n)}
              className="relative grid size-9 place-items-center rounded-full border bg-sheet transition-[transform,border-color] duration-200 ease-expo hover:-translate-y-0.5"
              style={{ borderColor: on ? `rgb(${c})` : "var(--color-line-1, rgba(44,20,10,0.10))" }}>
              <ServiceIcon service={x.id} size={28} />
              {on && !reduce && !paused && <svg className="pointer-events-none absolute -inset-px size-[38px] -rotate-90" viewBox="0 0 38 38" aria-hidden="true"><circle cx="19" cy="19" r="18" fill="none" stroke={`rgb(${c})`} strokeWidth="2" strokeDasharray="113" style={{ strokeDashoffset: 113, animation: "hero-progress 3.85s linear forwards" }} key={`${i}`} /></svg>}
            </button>
          );
        })}
      </div>

      <div className="relative w-full overflow-hidden rounded-2xl border border-border bg-sheet shadow-lift">
        <span className="absolute inset-x-0 top-0 h-1 transition-colors duration-300" style={{ background: `rgb(${rgb})` }} aria-hidden="true" />
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={s.id} role="tabpanel" aria-label={s.tab}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[11px] font-medium" style={{ color: `rgb(${rgb})` }}>{s.kicker}</p>
                <p className="mt-1 text-[20px] font-semibold leading-tight text-deep-ink sm:text-2xl">{s.title}</p>
                <p className="text-xs text-muted-foreground">{s.sub}</p>
              </div>
              <div className="shrink-0"><ReadyRing value={(shown / 3) * 100} size={64} stroke={6} /></div>
            </div>
            <ul className="mt-5 space-y-2">
              {s.rows.map(([t, d], n) => {
                const ok = n < shown;
                return (
                  <li key={t} className="flex items-center gap-3 rounded-xl border border-line-1 px-3 py-2.5 transition-colors duration-300" style={ok ? { background: `rgba(${rgb},0.05)` } : undefined}>
                    <span className="grid size-6 shrink-0 place-items-center rounded-full transition-all duration-300" style={ok ? { background: `rgb(${rgb})`, color: "#fff" } : { border: "1.5px solid var(--color-line-2, rgba(44,20,10,0.18))" }}>
                      {ok && <Check className="size-3.5" strokeWidth={3} />}
                    </span>
                    <span className="min-w-0"><span className="block text-[13px] font-medium text-deep-ink">{t}</span><span className="block text-[11px] text-muted-foreground">{d}</span></span>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="absolute -right-2 bottom-0 z-10 flex items-center gap-2 rounded-xl border border-border bg-sheet px-3 py-2 shadow-lift transition-opacity duration-300 sm:-right-8" style={{ opacity: shown >= 3 ? 1 : 0 }} aria-hidden={shown < 3}>
        <span className="grid size-7 place-items-center rounded-lg" style={{ background: `rgba(${rgb},0.12)`, color: `rgb(${rgb})` }}><CalendarCheck className="size-3.5" /></span>
        <span className="text-xs leading-4"><span className="block font-medium text-deep-ink">{s.done}</span><span className="text-muted-foreground">Handled by Claire</span></span>
      </div>
    </div>
  );
}
