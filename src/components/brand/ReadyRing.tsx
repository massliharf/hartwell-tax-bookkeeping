import { motion, useReducedMotion } from "framer-motion";

type Props = { value: number; size?: number; stroke?: number; label?: string; className?: string };

/** Signature "Ready ring" — circular progress showing how ready an appointment is. */
export function ReadyRing({ value, size = 120, stroke = 8, label = "Ready", className }: Props) {
  const reduce = useReducedMotion();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const done = pct >= 100;
  return (
    <div className={className} style={{ width: size, height: size, position: "relative" }} role="img" aria-label={`${label} ${Math.round(pct)}%`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--sage)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={done ? "var(--success)" : "var(--marigold)"}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={false}
          animate={{ strokeDashoffset: c - (pct / 100) * c }}
          transition={reduce ? { duration: 0 } : { duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="tabular font-serif leading-none text-deep-ink" style={{ fontSize: size * 0.28 }}>
          {Math.round(pct)}
          <span style={{ fontSize: size * 0.14 }}>%</span>
        </span>
        <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}
