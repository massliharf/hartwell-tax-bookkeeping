import { Link } from "@tanstack/react-router";
import { X } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Stepper } from "@/components/ui/stepper";
import type { ReactNode } from "react";

export const STEPS = ["What you need", "Pick a time", "Your details"] as const;

export function BookingShell({ step, children }: { step?: number; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-paper-warm">
      <header className="border-b border-line-1 bg-paper-warm">
        <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between gap-4 px-4 sm:px-5">
          <Link to="/" aria-label="Hartwell Tax & Bookkeeping, home" className="flex min-h-10 min-w-0 items-center"><Logo /></Link>
          <Link to="/" aria-label="Leave booking" className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-fill-neutral text-deep-ink hover:bg-fill-selected sm:size-8 sm:rounded-lg">
            <X className="size-4" />
          </Link>
        </div>
      </header>
      <div className="mx-auto min-h-[calc(100vh-68px)] max-w-6xl rounded-t-2xl bg-sheet sm:my-4 sm:min-h-0 sm:rounded-2xl">
        {step !== undefined && <Progress step={step} />}
        <main className="px-6 pb-24 pt-8 sm:px-8 sm:pt-10">{children}</main>
      </div>
    </div>
  );
}

function Progress({ step }: { step: number }) {
  return <div className="px-6 pt-6 sm:px-8"><Stepper steps={STEPS} current={step} label="Booking progress" className="max-w-xl" /></div>;
}

export function StepTitle({ eyebrow, title, sub, hideEyebrow = false }: { eyebrow: string; title: string; sub?: string; hideEyebrow?: boolean }) {
  return (
    <div className="mb-8">
       {!hideEyebrow && <p className="text-xs font-medium leading-6 text-muted-foreground">{eyebrow}</p>}
       <h1 className={`${hideEyebrow ? "" : "mt-1 "}t-page text-deep-ink`}>{title}</h1>
      {sub && <p className="mt-2 text-sm text-muted-foreground">{sub}</p>}
    </div>
  );
}

/** The one centered "outcome" layout used by every client page (booked, sent, expired link, taken, not found). */
export function ResultPanel({ icon, tone = "neutral", eyebrow, title, children, actions }: {
  icon?: ReactNode; tone?: "neutral" | "success" | "warning"; eyebrow?: string; title: string; children?: ReactNode; actions?: ReactNode;
}) {
  const ring = tone === "success" ? "bg-alert-success text-alert-success-fg" : tone === "warning" ? "bg-alert-warning text-alert-warning-fg" : "bg-tint-1 text-deep-ink";
  return (
    <div className="mx-auto max-w-md py-6 text-center sm:py-10">
      {icon && <span className={`mx-auto grid size-12 place-items-center rounded-full [&_svg]:size-5 ${ring} ${tone === "success" ? "draw-check" : ""}`}>{icon}</span>}
      {eyebrow && <p className={`${icon ? "mt-5" : ""} text-[13px] text-muted-foreground`}>{eyebrow}</p>}
      <h1 className={`${icon && !eyebrow ? "mt-5" : eyebrow ? "mt-1" : ""} t-page text-balance text-deep-ink`}>{title}</h1>
      {children && <div className="mt-3 text-[15px] leading-6 text-muted-foreground [&_strong]:font-medium [&_strong]:text-deep-ink">{children}</div>}
      {actions && <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row">{actions}</div>}
    </div>
  );
}
