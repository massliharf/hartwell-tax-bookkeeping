import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { HOURS } from "@/lib/services";

export function AnnouncementBar() {
  return (
    <div className="bg-canvas px-2 pt-2">
      <Link
        to="/book"
        search={{ service: "extension" }}
        className="mx-auto flex min-h-[54px] max-w-6xl flex-wrap items-center justify-center gap-2 rounded-2xl bg-sheet px-[18px] py-3 text-center text-sm text-deep-ink"
      >
        <span className="rounded-full bg-[rgba(30,91,71,0.15)] px-2 text-[10px] font-medium uppercase tracking-[0.2px] text-ink">Oct 15</span>
        <span>
          Filing an extension? The deadline is October 15 — <span className="font-semibold text-ink underline-offset-4 hover:underline">book your slot</span>.
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
          <span className="font-serif text-2xl leading-none text-ink">Hartwell</span>
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
          className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-ink px-4 text-sm font-medium text-primary-foreground transition hover:-translate-y-0.5"
        >
          Book <ArrowRight className="size-4" />
        </Link>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-deep-ink text-primary-foreground/85">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <p className="font-serif text-4xl text-primary-foreground">Hartwell Tax & Bookkeeping</p>
          <p className="mt-3 max-w-sm text-sm text-primary-foreground/65">Claire Hartwell, EA · IRS Enrolled Agent. Careful, calm tax work for families and small businesses in Montclair.</p>
        </div>
        <div className="text-sm">
          <p className="mb-3 text-xs uppercase text-marigold">Visit</p>
          <p>412 Bloomfield Avenue</p>
          <p>Montclair, NJ 07042</p>
          <a href="tel:+19735550142" className="tabular mt-3 block hover:text-primary-foreground">(973) 555-0142</a>
        </div>
        <div className="text-sm">
          <p className="mb-3 text-xs uppercase text-marigold">Hours</p>
          {HOURS.map((h) => (
            <p key={h.days} className="tabular flex justify-between gap-4">
              <span>{h.days}</span>
              <span className="text-primary-foreground/65">{h.time}</span>
            </p>
          ))}
        </div>
      </div>
      <div className="border-t border-paper/10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-5 text-xs text-primary-foreground/50">
          <span>© {new Date().getFullYear()} Hartwell Tax & Bookkeeping</span>
          <Link to="/owner" className="hover:text-primary-foreground">Owner login</Link>
        </div>
      </div>
    </footer>
  );
}
