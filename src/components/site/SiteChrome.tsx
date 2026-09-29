import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { HOURS } from "@/lib/services";
import { Button } from "@/components/ui/button";

export function AnnouncementBar() {
  return (
    <div className="bg-ink text-paper">
      <Link
        to="/book"
        search={{ service: "extension" }}
        className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-5 py-2 text-center text-[13px]"
      >
        <span className="size-1.5 shrink-0 rounded-full bg-marigold" />
        <span>
          Filing an extension? The deadline is October 15 — <span className="underline decoration-marigold underline-offset-4">book your slot</span>.
        </span>
      </Link>
    </div>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between gap-4 px-5">
        <Link to="/" className="shrink-0 font-serif text-[27px] leading-none text-ink">Patel Tax</Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-deep-ink/80 md:flex">
          <a href="#services" className="hover:text-ink">Services</a>
          <a href="#about" className="hover:text-ink">About</a>
          <a href="#reviews" className="hover:text-ink">Reviews</a>
        </nav>
        <div className="flex items-center gap-3 sm:gap-6">
          <Link to="/owner" className="text-xs font-medium text-muted-foreground hover:text-ink sm:text-sm">Owner login</Link>
          <Button asChild size="sm"><Link to="/book">Book <ArrowRight className="size-4" /></Link></Button>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-20 bg-deep-ink text-primary-foreground/85">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <p className="font-serif text-4xl text-primary-foreground">Patel Tax & Bookkeeping</p>
          <p className="mt-3 max-w-sm text-sm text-primary-foreground/75">Priya Patel, EA · IRS Enrolled Agent. Careful, calm tax work for families and small businesses in Edison.</p>
        </div>
        <div className="text-sm">
          <p className="mb-3 text-xs uppercase tracking-[0.14em] text-marigold">Visit</p>
          <p>Oak Tree Road</p>
          <p>Edison, NJ 08820</p>
          <p className="mt-3 text-xs text-primary-foreground/75">Call details provided after booking.</p>
        </div>
        <div className="text-sm">
          <p className="mb-3 text-xs uppercase tracking-[0.14em] text-marigold">Hours</p>
          {HOURS.map((h) => (
            <p key={h.days} className="tabular flex justify-between gap-4">
              <span>{h.days}</span>
              <span className="text-primary-foreground/75">{h.time}</span>
            </p>
          ))}
        </div>
      </div>
      <div className="border-t border-primary-foreground/20">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-5 text-xs text-primary-foreground/70">
          <span>© {new Date().getFullYear()} Patel Tax & Bookkeeping</span>
          <Link to="/owner" className="hover:text-primary-foreground">Owner login</Link>
        </div>
      </div>
    </footer>
  );
}
