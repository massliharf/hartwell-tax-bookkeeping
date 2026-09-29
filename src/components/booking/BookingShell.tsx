import { Link } from "@tanstack/react-router";
import { Check, X } from "lucide-react";
import type { ReactNode } from "react";

export const STEPS = ["Service", "Questions", "Time", "Details"] as const;

export function BookingShell({ step, children }: { step?: number; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas">
       <header className="mx-2 mt-2 rounded-[20px] bg-paper sm:mx-4">
         <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-5">
          <Link to="/" className="flex min-w-0 items-baseline gap-2">
             <span className="font-sans text-2xl font-semibold leading-none text-evergreen">Patel</span>
            <span className="truncate text-[13px] text-muted-foreground">Tax & Bookkeeping</span>
          </Link>
          <Link to="/" aria-label="Leave booking" className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-sage hover:text-ink">
            <X className="size-4" />
          </Link>
        </div>
      </header>
       <main className="mx-auto max-w-[1120px] px-2 pb-24 pt-4 sm:px-4">{step !== undefined && <Progress step={step} />}{children}</main>
    </div>
  );
}

function Progress({ step }: { step: number }) {
  return (
    <div className="mb-4 rounded-[20px] bg-paper px-5 py-5">
      <ol className="flex items-center gap-2" aria-label="Booking progress">
        {STEPS.map((label, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <li key={label} className="flex flex-1 items-center gap-2" aria-current={active ? "step" : undefined}>
              <span
                className={`tabular grid size-7 shrink-0 place-items-center rounded-full border text-xs font-medium transition-colors duration-300 ${
                   done ? "border-evergreen bg-evergreen text-paper" : active ? "border-deep-ink bg-paper text-deep-ink" : "border-line bg-transparent text-muted-foreground"
                }`}
              >
                {done ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
              </span>
              <span className={`hidden text-sm sm:inline ${active ? "text-deep-ink" : "text-muted-foreground"}`}>{label}</span>
              {i < STEPS.length - 1 && (
                <span className="relative h-px flex-1 bg-border">
                   <span className="absolute inset-y-0 left-0 bg-evergreen transition-all duration-500" style={{ width: done ? "100%" : "0%" }} />
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function StepTitle({ title, sub }: { eyebrow?: string; title: string; sub?: string }) {
  return (
    <div className="mb-8">
       <h1 tabIndex={-1} className="text-3xl leading-tight text-deep-ink focus:outline-none sm:text-4xl">{title}</h1>
      {sub && <p className="mt-3 text-[15px] text-deep-ink/70">{sub}</p>}
    </div>
  );
}
