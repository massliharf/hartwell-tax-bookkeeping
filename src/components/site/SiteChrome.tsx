import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { HOURS } from "@/lib/services";

export function AnnouncementBar() {
  return (
    <div className="bg-ink text-paper">
      <Link
        to="/book"
        search={{ service: "extension" }}
        className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-5 py-2 text-center text-[13px]"
      >
        <span className="size-1.5 shrink-0 rounded-full bg-ink" />
        <span>
          Filing an extension? The deadline is October 15 — <span className="underline decoration-ink underline-offset-4">book your slot</span>.
        </span>
      </Link>
    </div>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
        <Link to="/" className="flex min-w-0 items-baseline gap-2">
          <span className="font-sans text-2xl leading-none text-ink">Patel</span>
          <span className="truncate text-[13px] text-muted-foreground">Tax & Bookkeeping</span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-deep-ink/80 md:flex">
          <a href="#how" className="hover:text-ink">How it works</a>
          <a href="#services" className="hover:text-ink">Services</a>
          <a href="#about" className="hover:text-ink">About</a>
          <a href="#faq" className="hover:text-ink">FAQ</a>
        </nav>
        <Link
          to="/book"
          className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-ink px-4 text-sm font-medium text-paper transition hover:-translate-y-0.5"
        >
          Book <ArrowRight className="size-4" />
        </Link>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
     <footer className="bg-ink text-paper/85">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <p className="font-sans text-4xl text-paper">Patel Tax & Bookkeeping</p>
          <p className="mt-3 max-w-sm text-sm text-paper/65">Priya Patel, EA · IRS Enrolled Agent. Careful, calm tax work for families and small businesses in Edison.</p>
        </div>
        <div className="text-sm">
          <p className="mb-3 text-xs uppercase tracking-[0.14em] text-paper">Visit</p>
          <p>Oak Tree Road</p>
          <p>Edison, NJ 08820</p>
          <a href="tel:+17325550142" className="tabular mt-3 block hover:text-paper">(732) 555-0142</a>
        </div>
        <div className="text-sm">
          <p className="mb-3 text-xs uppercase tracking-[0.14em] text-paper">Hours</p>
          {HOURS.map((h) => (
            <p key={h.days} className="tabular flex justify-between gap-4">
              <span>{h.days}</span>
              <span className="text-paper/65">{h.time}</span>
            </p>
          ))}
        </div>
      </div>
      <div className="border-t border-paper/10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-5 text-xs text-paper/50">
          <span>© {new Date().getFullYear()} Patel Tax & Bookkeeping</span>
          <Link to="/owner" className="hover:text-paper">Owner login</Link>
        </div>
      </div>
    </footer>
  );
}
