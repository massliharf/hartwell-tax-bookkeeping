import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ComingSoon } from "@/components/site/ComingSoon";
import { SERVICES } from "@/lib/services";

export const Route = createFileRoute("/book")({
  validateSearch: z.object({ service: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Book an appointment — Patel Tax & Bookkeeping" },
      { name: "description", content: "Book a tax appointment with Priya Patel, EA in Edison, NJ. Confirmed instantly." },
      { property: "og:title", content: "Book an appointment — Patel Tax & Bookkeeping" },
      { property: "og:description", content: "Pick a service and a time. Confirmed instantly." },
    ],
  }),
  component: BookPage,
});

function BookPage() {
  const { service } = Route.useSearch();
  const s = SERVICES.find((x) => x.id === service);
  return (
    <ComingSoon title="Booking opens soon">
      {s ? <p>You picked <strong className="text-deep-ink">{s.name}</strong>. The booking calendar is on its way.</p> : <p>The booking calendar is on its way.</p>}
    </ComingSoon>
  );
}
