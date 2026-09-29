import { motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";

type Props = { value: number; size?: number; stroke?: number; label?: string; className?: string };

/** Signature "Ready ring" — circular progress showing how ready an appointment is. */
export function ReadyRing({ value, size = 72, stroke = 7, label = "Ready", className }: Props) {
  const reduce = useReducedMotion();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const done = pct >= 100;
  return (
    <div className={className} style={{ width: size, height: size, position: "relative" }} role="img" aria-label={`${label} ${Math.round(pct)}%`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--control)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
           stroke={done ? "var(--evergreen)" : "var(--marigold)"}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={false}
          animate={{ strokeDashoffset: c - (pct / 100) * c }}
           transition={reduce ? { duration: 0 } : { duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {done ? <Check className="text-evergreen" style={{ width: size * 0.35, height: size * 0.35 }} strokeWidth={2.5} /> : <span className="tabular font-sans font-semibold leading-none text-deep-ink" style={{ fontSize: size * 0.25 }}>{Math.round(pct)}%</span>}
        {size >= 72 && <span className="mt-1 text-[10px] font-medium text-graphite">{label}</span>}
      </div>
    </div>
  );
}
