import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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

function Wordmark() {
  return (
    <Link to="/" className="flex min-w-0 items-center gap-2.5">
      <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-lg bg-deep-ink font-serif text-base text-primary-foreground">H</span>
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="text-sm font-semibold text-deep-ink">Hartwell Tax</span>
        <span className="truncate text-[11px] text-muted-foreground">& Bookkeeping, Montclair NJ</span>
      </span>
    </Link>
  );
}

const LINKS = [{ href: "/#what", label: "What we do" }, { href: "/#how", label: "How it works" }, { href: "/#services", label: "Prices" }, { href: "/#about", label: "About" }, { href: "/#faq", label: "FAQ" }];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-canvas/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-5">
        <Wordmark />
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => <a key={l.href} href={l.href} className="flex h-8 items-center rounded-lg px-3 text-[13px] font-medium text-[#363636] transition-colors duration-150 hover:bg-fill-subtle hover:text-deep-ink">{l.label}</a>)}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <Button asChild variant="ghost"><Link to="/book/returning">My appointment</Link></Button>
          <Button asChild><Link to="/book">Book an appointment</Link></Button>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="secondary" size="icon" className="md:hidden" aria-label="Open menu"><Menu className="size-5" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={8} className="w-[calc(100vw-32px)] max-w-xs rounded-2xl border-[rgba(16,16,16,0.1)] p-2 shadow-lift">
            {LINKS.map((l) => <DropdownMenuItem key={l.href} asChild className="h-11 rounded-lg px-3 text-sm"><a href={l.href}>{l.label}</a></DropdownMenuItem>)}
            <DropdownMenuItem asChild className="h-11 rounded-lg px-3 text-sm"><Link to="/book/returning">My appointment</Link></DropdownMenuItem>
            <div className="p-1 pt-2"><Button asChild size="lg" className="w-full"><Link to="/book">Book an appointment</Link></Button></div>
          </DropdownMenuContent>
        </DropdownMenu>
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
          <a href="tel:+19735550142" className="tabular mt-2 flex min-h-10 items-center hover:text-deep-ink">(973) 555-0142</a>
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
          <Link to="/owner" className="inline-flex min-h-10 items-center hover:text-deep-ink">Owner login</Link>
        </div>
      </div>
    </footer>
  );
}
