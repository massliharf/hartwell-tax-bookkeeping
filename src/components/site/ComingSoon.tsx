import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { SiteFooter, SiteHeader } from "./SiteChrome";

export function ComingSoon({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-xl px-5 py-24">
        <div className="sheet-stack ledger p-8 text-center">
          <h1 className="text-2xl leading-9 sm:text-[28px] sm:leading-[42px] text-deep-ink">{title}</h1>
          <div className="mt-4 text-deep-ink/70">{children}</div>
          <Link to="/" className="mt-8 inline-block text-sm font-medium text-ink underline underline-offset-4">Back to home</Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
