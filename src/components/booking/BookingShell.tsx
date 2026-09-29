import { Link } from "@tanstack/react-router";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

export const STEPS = ["Service", "Questions", "Time", "Details"] as const;

export function BookingShell({ step, children }: { step?: number; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-sheet md:py-8">
      <div className="mx-auto max-w-5xl bg-background md:overflow-hidden md:rounded-[14px] md:border md:border-border md:shadow-lift">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-5 sm:px-10">
          <Link to="/" className="flex min-w-0 items-baseline gap-2">
            <span className="font-serif text-2xl leading-none text-ink">Patel</span>
            <span className="truncate text-[13px] text-muted-foreground">Tax & Bookkeeping</span>
          </Link>
          <Button asChild size="icon" variant="ghost" className="size-9 rounded-full"><Link to="/" aria-label="Leave booking"><X className="size-4" /></Link></Button>
        </div>
      </header>
      {step !== undefined && <Progress step={step} />}
      <main className="mx-auto min-h-[calc(100dvh-150px)] max-w-5xl px-5 pb-20 pt-8 sm:px-10 sm:pt-12 md:min-h-[590px]">{children}</main>
      </div>
    </div>
  );
}

function Progress({ step }: { step: number }) {
  return (
    <div className="mx-auto max-w-5xl px-5 pt-6 sm:px-10">
      <ol className="flex items-center gap-2" aria-label="Booking progress">
        {STEPS.map((label, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <li key={label} className="flex flex-1 items-center gap-2" aria-current={active ? "step" : undefined}>
              <span
                className={`tabular grid size-7 shrink-0 place-items-center rounded-full border text-xs font-medium transition-colors duration-300 ${
                  done ? "border-ink bg-ink text-paper" : active ? "border-ink bg-sheet text-ink" : "border-border bg-transparent text-muted-foreground"
                }`}
              >
                {done ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
              </span>
              <span className={`hidden text-sm sm:inline ${active ? "text-deep-ink" : "text-muted-foreground"}`}>{label}</span>
              {i < STEPS.length - 1 && (
                <span className="relative h-px flex-1 bg-border">
                  <span className="absolute inset-y-0 left-0 bg-ink transition-all duration-500" style={{ width: done ? "100%" : "0%" }} />
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function StepTitle({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div className="mb-8">
      <p className="text-xs font-semibold uppercase text-ink">{eyebrow}</p>
      <h1 tabIndex={-1} className="mt-2 font-serif text-4xl leading-tight text-deep-ink focus:outline-none sm:text-5xl">{title}</h1>
      {sub && <p className="mt-3 text-[15px] text-deep-ink/70">{sub}</p>}
    </div>
  );
}
