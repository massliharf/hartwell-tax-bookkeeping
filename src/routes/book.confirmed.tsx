import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { Link as LinkIcon } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { BookingShell, ResultPanel } from "@/components/booking/BookingShell";

export const Route = createFileRoute("/book/confirmed")({
  validateSearch: z.object({ token: z.string().min(10).max(100).optional() }),
  head: () => ({
    meta: [
      { title: "You're booked — Hartwell Tax & Bookkeeping" },
      { name: "description", content: "Your appointment is confirmed." },
      { property: "og:title", content: "You're booked — Hartwell Tax & Bookkeeping" },
      { property: "og:description", content: "Your appointment with Claire Hartwell, EA is confirmed." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ConfirmedPage,
});

function ConfirmedPage() {
  const { token } = Route.useSearch();
  if (token) return <Navigate to="/a/$token" params={{ token }} search={{ booked: true }} replace />;
  return <BookingShell><ResultPanel icon={<LinkIcon />} tone="warning" title="We couldn't find that appointment." actions={<><Button asChild size="lg"><Link to="/book/returning">Email me my link</Link></Button><Button asChild size="lg" variant="secondary"><Link to="/book">Schedule an appointment</Link></Button></>}>
    Check the link in your confirmation email, or we can email you a new one.
  </ResultPanel></BookingShell>;
}
