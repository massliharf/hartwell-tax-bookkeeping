import { Link } from "@tanstack/react-router";
import { Check, X } from "lucide-react";
import type { ReactNode } from "react";

export const STEPS = ["Service", "Questions", "Time", "Details"] as const;

export function BookingShell({ step, children }: { step?: number; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-paper sm:bg-canvas sm:p-2">
      <header>
        <div className="mx-auto flex h-[60px] max-w-6xl items-center justify-between gap-4 px-6 sm:px-4">
          <Link to="/" className="flex min-w-0 items-baseline gap-2">
            <span className="text-sm font-semibold text-deep-ink">Hartwell Tax</span>
            <span className="truncate text-xs text-muted-foreground">& Bookkeeping</span>
          </Link>
          <Link to="/" aria-label="Leave booking" className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-fill-neutral text-deep-ink hover:bg-[#DBDBDB] sm:size-8 sm:rounded-lg">
            <X className="size-4" />
          </Link>
        </div>
      </header>
      <div className="mx-auto min-h-[calc(100vh-76px)] max-w-6xl rounded-t-2xl bg-sheet sm:rounded-2xl">
        {step !== undefined && <Progress step={step} />}
        <main className="px-6 pb-24 pt-8 sm:px-8 sm:pt-10">{children}</main>
      </div>
    </div>
  );
}

function Progress({ step }: { step: number }) {
  return (
    <div className="px-6 pt-6 sm:px-8">
      <ol className="flex gap-1 overflow-x-auto [scrollbar-width:none] sm:overflow-visible" aria-label="Booking progress">
        {STEPS.map((label, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <li key={label} aria-current={active ? "step" : undefined}
               className={`flex h-8 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-medium min-[390px]:px-3 sm:px-4 sm:text-xs ${active ? "bg-fill-selected text-deep-ink" : done ? "text-deep-ink" : "text-muted-foreground"}`}>
              {done ? <Check className="size-3.5 text-ink" strokeWidth={3} /> : <span className="tabular">{i + 1}</span>}
              {label}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function StepTitle({ eyebrow, title, sub, hideEyebrow = false }: { eyebrow: string; title: string; sub?: string; hideEyebrow?: boolean }) {
  return (
    <div className="mb-8">
       {!hideEyebrow && <p className="text-xs font-medium leading-6 text-muted-foreground">{eyebrow}</p>}
       <h1 className={`${hideEyebrow ? "" : "mt-1 "}text-2xl leading-9 text-deep-ink sm:text-[28px] sm:leading-[42px]`}>{title}</h1>
      {sub && <p className="mt-2 text-sm text-muted-foreground">{sub}</p>}
    </div>
  );
}
