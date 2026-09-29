import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { HOURS } from "@/lib/services";

export function AnnouncementBar() {
  return (
    <div className="bg-evergreen text-paper">
      <Link
        to="/book"
        search={{ service: "extension" }}
        className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-5 py-2 text-center text-[13px]"
      >
        <span className="size-1.5 shrink-0 rounded-full bg-paper" />
        <span>
          Filing an extension? The deadline is October 15 — <span className="underline decoration-ink underline-offset-4">book your slot</span>.
        </span>
      </Link>
    </div>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 mx-2 mt-2 rounded-[20px] bg-paper sm:mx-4">
      <div className="mx-auto flex h-16 max-w-[1120px] items-center justify-between gap-4 px-5">
        <Link to="/" className="flex min-w-0 items-baseline gap-2">
           <span className="font-sans text-xl font-semibold leading-none text-evergreen">Patel Tax</span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-graphite md:flex">
          <a href="#services" className="hover:text-ink">Services</a>
          <a href="#about" className="hover:text-ink">About</a>
           <a href="#reviews" className="hover:text-ink">Reviews</a>
           <Link to="/book/returning" className="hover:text-ink">Find my appointment</Link>
        </nav>
        <Button asChild size="sm"><Link to="/book">Book</Link></Button>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
      <footer className="mx-2 mb-2 rounded-[20px] bg-evergreen text-paper/85 sm:mx-4">
       <div className="mx-auto grid max-w-[1120px] gap-10 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <p className="font-sans text-4xl text-paper">Patel Tax & Bookkeeping</p>
           <p className="mt-3 max-w-sm text-sm text-paper/75">Priya Patel, EA. Careful, calm tax work for families and small businesses in Edison.</p>
        </div>
        <div className="text-sm">
           <p className="mb-3 text-sm font-semibold text-paper">Visit</p>
          <p>Oak Tree Road</p>
          <p>Edison, NJ 08820</p>
          <a href="tel:+17325550142" className="tabular mt-3 block hover:text-paper">(732) 555-0142</a>
        </div>
        <div className="text-sm">
           <p className="mb-3 text-sm font-semibold text-paper">Hours</p>
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
