import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/Logo";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Menu } from "lucide-react";
import { HOURS } from "@/lib/services";
import { OFFICE_EMAIL, OFFICE_EMAIL_HREF, OFFICE_PHONE, OFFICE_PHONE_HREF } from "@/lib/meeting";

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
  return <Link to="/" aria-label="Hartwell Tax & Bookkeeping, home" className="flex min-h-10 min-w-0 items-center"><Logo sub="Tax & Bookkeeping, Montclair NJ" /></Link>;
}

const LINKS = [{ href: "/#services", label: "Services and prices" }, { href: "/#about", label: "Meet Claire" }, { href: "/#how", label: "How it works" }, { href: "/#faq", label: "Questions" }, { href: "/ask", label: "Ask a question" }];

export function SiteHeader({ warm = false }: { warm?: boolean } = {}) {
  return (
    <header className={`sticky top-0 z-40 border-b border-line-1 backdrop-blur-lg ${warm ? "bg-paper-warm/95" : "bg-canvas/95"}`}>
      <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between gap-4 px-4 sm:px-5">
        <Wordmark />
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => <a key={l.href} href={l.href} className="flex h-10 items-center rounded-lg px-2 text-[13px] font-medium text-body transition-colors duration-150 hover:bg-fill-subtle hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{l.label}</a>)}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <Button asChild variant="link"><Link to="/book/returning">My appointment</Link></Button>
          <Button asChild><Link to="/book">Schedule an appointment</Link></Button>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="secondary" size="icon" className="md:hidden" aria-label="Open menu"><Menu className="size-5" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={8} className="w-[calc(100vw-32px)] max-w-xs rounded-2xl border-border p-2 shadow-lift">
            {LINKS.map((l) => <DropdownMenuItem key={l.href} asChild className="h-11 rounded-lg px-3 text-sm"><a href={l.href}>{l.label}</a></DropdownMenuItem>)}
            <DropdownMenuItem asChild className="h-11 rounded-lg px-3 text-sm"><Link to="/book/returning">My appointment</Link></DropdownMenuItem>
            <div className="p-1 pt-2"><Button asChild size="lg" className="w-full"><Link to="/book">Schedule an appointment</Link></Button></div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

// Contact lines in the footer stack evenly with the address.
export function SiteFooter() {
  return (
    <footer className="mt-16 bg-night text-white/80 lg:mt-24">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <Logo tone="light" />
          <p className="mt-4 max-w-xs text-sm leading-6 text-white/60">Tax preparation and bookkeeping in Montclair, NJ. Claire Hartwell, EA.</p>
        </div>
        <div className="text-sm">
          <p className="mb-3 font-serif text-base font-semibold text-[#E7B4A8]">Schedule</p>
          <ul className="space-y-2">
            <li><Link to="/book" className="inline-flex min-h-10 items-center hover:text-white">Schedule an appointment</Link></li>
            <li><Link to="/book/returning" className="inline-flex min-h-10 items-center hover:text-white">My appointment</Link></li>
            <li><a href="/#services" className="inline-flex min-h-10 items-center hover:text-white">Services and prices</a></li>
            <li><a href="/#faq" className="inline-flex min-h-10 items-center hover:text-white">FAQ</a></li>
          </ul>
        </div>
        <div className="flex flex-col text-sm">
          <p className="mb-3 font-serif text-base font-semibold text-[#E7B4A8]">Visit</p>
          <p>412 Bloomfield Avenue</p>
          <p>Montclair, NJ 07042</p>
          <a href={OFFICE_PHONE_HREF} className="tabular -my-2 flex min-h-9 items-center hover:text-white">{OFFICE_PHONE}</a>
          <a href={OFFICE_EMAIL_HREF} className="-my-2 flex min-h-9 items-center hover:text-white">{OFFICE_EMAIL}</a>
        </div>
        <div className="text-sm">
          <p className="mb-3 font-serif text-base font-semibold text-[#E7B4A8]">Hours</p>
          {HOURS.map((h) => (
            <p key={h.days} className="tabular flex justify-between gap-4 whitespace-nowrap">
              <span>{h.days}</span>
              <span className="text-white/50">{h.time}</span>
            </p>
          ))}
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-5 text-xs text-white/50">
          <span>© {new Date().getFullYear()} Hartwell Tax & Bookkeeping</span>
          <Link to="/owner" className="inline-flex min-h-10 items-center hover:text-white">Owner view</Link>
        </div>
      </div>
    </footer>
  );
}
