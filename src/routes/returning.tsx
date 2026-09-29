import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/site/ComingSoon";

export const Route = createFileRoute("/returning")({
  head: () => ({
    meta: [
      { title: "Returning clients — Patel Tax & Bookkeeping" },
      { name: "description", content: "Welcome back. Book this year's appointment with Priya Patel, EA." },
      { property: "og:title", content: "Returning clients — Patel Tax & Bookkeeping" },
      { property: "og:description", content: "Welcome back. Book this year's appointment." },
    ],
  }),
  component: () => <ComingSoon title="Welcome back"><p>Returning client booking is on its way.</p></ComingSoon>,
});
