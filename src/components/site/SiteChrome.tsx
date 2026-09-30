import { Link } from "@tanstack/react-router";
import { Button, buttonVariants } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { HOURS } from "@/lib/services";

export function AnnouncementBar() {
  return (
    <div className="border-b border-border bg-sheet px-5">
      <Link
        to="/book"
        search={{ service: "extension" }}
        className="mx-auto block min-h-10 max-w-6xl py-2 text-center text-xs leading-5 text-deep-ink sm:text-sm"
      >
        <span className="mr-2 font-medium text-deep-ink">Oct 15</span>
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
      <div className="mx-auto grid h-[60px] max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 sm:flex sm:justify-between">
        <Link to="/" className="flex min-w-0 items-baseline gap-2">
          <span className="text-sm font-semibold text-deep-ink">Hartwell Tax</span>
          <span className="truncate text-xs text-muted-foreground">& Bookkeeping</span>
        </Link>
        <nav className="hidden items-center gap-1 text-xs font-medium text-deep-ink sm:flex">
          <a href="#how" className="rounded-lg px-3 py-1.5 hover:bg-fill-subtle">How it works</a>
          <a href="#services" className="rounded-lg px-3 py-1.5 hover:bg-fill-subtle">Services</a>
          <a href="#about" className="rounded-lg px-3 py-1.5 hover:bg-fill-subtle">About</a>
          <a href="#faq" className="rounded-lg px-3 py-1.5 hover:bg-fill-subtle">FAQ</a>
        </nav>
        <Button asChild className="hidden sm:inline-flex"><Link to="/book">Book</Link></Button>
        <Sheet>
          <SheetTrigger asChild><Button variant="secondary" size="icon" className="size-10 shrink-0 sm:hidden" aria-label="Open menu"><Menu className="size-5" /></Button></SheetTrigger>
          <SheetContent side="right" className="w-[min(85vw,320px)] border-border bg-sheet pt-14 sm:hidden">
            <SheetHeader className="text-left"><SheetTitle>Hartwell Tax</SheetTitle></SheetHeader>
            <nav aria-label="Mobile navigation" className="mt-8 flex flex-col gap-1 text-sm font-medium text-deep-ink">
              {[{ href: "/#how", label: "How it works" }, { href: "/#services", label: "Services" }, { href: "/#about", label: "About" }, { href: "/#faq", label: "FAQ" }].map((item) => (
                <SheetClose asChild key={item.href}><a href={item.href} className="rounded-lg px-3 py-3 hover:bg-fill-neutral">{item.label}</a></SheetClose>
              ))}
              <SheetClose asChild><Link to="/book" className={buttonVariants({ className: "mt-4" })}>Book</Link></SheetClose>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-16 bg-surface-2 text-[#363636] lg:mt-24">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1.2fr]">
        <div>
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
            <p key={h.days} className="tabular flex justify-between gap-4 whitespace-nowrap">
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
