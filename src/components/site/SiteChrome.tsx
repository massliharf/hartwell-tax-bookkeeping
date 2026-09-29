import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HOURS } from "@/lib/services";

export function AnnouncementBar() {
  return (
    <div className="border-b border-border bg-sheet px-5">
      <Link
        to="/book"
        search={{ service: "extension" }}
        className="mx-auto flex min-h-10 max-w-6xl flex-wrap items-center justify-center gap-2 py-2 text-center text-xs text-deep-ink sm:text-sm"
      >
        <span className="font-medium text-ink">Oct 15</span>
        <span>
          Filing an extension? The deadline is October 15 — <span className="font-semibold text-ink underline-offset-4 hover:underline">book your slot</span>.
        </span>
      </Link>
    </div>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-canvas/90 backdrop-blur-md">
      <div className="mx-auto flex h-[60px] max-w-6xl items-center justify-between gap-4 px-5">
        <Link to="/" className="flex min-w-0 items-baseline gap-2">
          <span className="text-sm font-semibold text-deep-ink">Hartwell Tax</span>
          <span className="truncate text-xs text-muted-foreground">& Bookkeeping</span>
        </Link>
        <nav className="hidden items-center gap-1 text-xs font-medium text-deep-ink md:flex">
          <a href="#how" className="rounded-lg px-3 py-1.5 hover:bg-fill-subtle">How it works</a>
          <a href="#services" className="rounded-lg px-3 py-1.5 hover:bg-fill-subtle">Services</a>
          <a href="#about" className="rounded-lg px-3 py-1.5 hover:bg-fill-subtle">About</a>
          <a href="#faq" className="rounded-lg px-3 py-1.5 hover:bg-fill-subtle">FAQ</a>
        </nav>
        <Button asChild><Link to="/book">Book <ArrowRight className="size-3.5" /></Link></Button>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-surface-2 text-[#363636]">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <p className="text-base font-semibold text-deep-ink">Hartwell Tax & Bookkeeping</p>
           <p className="mt-2 max-w-sm text-sm text-muted-foreground">Claire Hartwell, EA, IRS Enrolled Agent. Careful, calm tax work for families and small businesses in Montclair.</p>
        </div>
        <div className="text-sm">
           <p className="mb-2 text-xs font-medium text-muted-foreground">Visit</p>
          <p>412 Bloomfield Avenue</p>
          <p>Montclair, NJ 07042</p>
          <a href="tel:+19735550142" className="tabular mt-3 block hover:text-deep-ink">(973) 555-0142</a>
        </div>
        <div className="text-sm">
           <p className="mb-2 text-xs font-medium text-muted-foreground">Hours</p>
          {HOURS.map((h) => (
            <p key={h.days} className="tabular flex justify-between gap-4">
              <span>{h.days}</span>
              <span className="text-muted-foreground">{h.time}</span>
            </p>
          ))}
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-5 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Hartwell Tax & Bookkeeping</span>
          <Link to="/owner" className="hover:text-deep-ink">Owner login</Link>
        </div>
      </div>
    </footer>
  );
}
