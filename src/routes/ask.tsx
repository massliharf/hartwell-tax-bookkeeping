import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site/SiteChrome";
import { AskForm } from "@/components/site/AskForm";

const T = "Ask a question | Hartwell Tax & Bookkeeping";
const D = "Ask Claire Hartwell, EA a question about prices, services or how it works. Simple questions get an instant answer.";

export const Route = createFileRoute("/ask")({
  head: () => ({ meta: [
    { title: T }, { name: "description", content: D },
    { property: "og:title", content: T }, { property: "og:description", content: D },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: AskPage,
});

function AskPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl px-5 py-12 sm:py-16">
        <h1 className="t-page text-deep-ink">Ask a question.</h1>
        <p className="mt-3 text-[15px] leading-6 text-body">Questions about prices, hours or how it works get an answer right away. Anything about your own taxes goes straight to Claire, and she replies by email.</p>
        <AskForm className="mt-8" />
      </main>
      <SiteFooter />
    </div>
  );
}
