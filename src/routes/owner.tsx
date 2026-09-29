import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/site/ComingSoon";

export const Route = createFileRoute("/owner")({
  head: () => ({
    meta: [
      { title: "Owner login — Patel Tax & Bookkeeping" },
      { name: "description", content: "Practice owner sign in." },
      { property: "og:title", content: "Owner login — Patel Tax & Bookkeeping" },
      { property: "og:description", content: "Practice owner sign in." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <ComingSoon title="Owner login"><p>The practice dashboard is coming next.</p></ComingSoon>,
});
