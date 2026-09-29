import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookingShell, StepTitle } from "@/components/booking/BookingShell";
import { lookupReturning } from "@/lib/booking.functions";
import { emptyDraft, writeDraft } from "@/lib/booking-store";
import { fromIntakePayload } from "@/lib/intake";

export const Route = createFileRoute("/book/returning")({
  head: () => ({
    meta: [
      { title: "Returning clients — Hartwell Tax & Bookkeeping" },
      { name: "description", content: "Booked with Claire before? Enter your email and book again in about 30 seconds." },
      { property: "og:title", content: "Returning clients — Hartwell Tax & Bookkeeping" },
      { property: "og:description", content: "Book again in about 30 seconds." },
    ],
  }),
  component: ReturningPage,
});

function ReturningPage() {
  const lookup = useServerFn(lookupReturning);
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "notfound" | "error">("idle");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("busy");
    try {
      const r = await lookup({ data: { email } });
      if (!r.found) return setState("notfound");
      const slug = r.serviceSlug ?? "individual";
      writeDraft({ ...emptyDraft, serviceSlug: slug, answers: fromIntakePayload(r.intake), name: r.name, email, phoneHint: r.phoneHint, returning: true });
      navigate({ to: "/book", search: { step: 2 } });
    } catch { setState("error"); }
  };

  return (
    <BookingShell>
      <div className="mx-auto max-w-md">
        <StepTitle eyebrow="Welcome back" title="Book again in 30 seconds" sub="Enter the email you used last time. We'll fill in your details and last year's answers." />
        <form onSubmit={submit} className="sheet-stack space-y-4 p-6">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => { setEmail(e.target.value); setState("idle"); }} className="h-12 bg-white" />
          </div>
          {state === "notfound" && (
            <p className="text-sm text-deep-ink/80">We couldn't find that email. Try another, or <Link to="/book" className="font-medium text-ink underline">book as a new client</Link> — it only takes two minutes.</p>
          )}
          {state === "error" && <p className="text-sm text-destructive">Something went wrong. Please try again.</p>}
          <Button type="submit" size="lg" className="w-full" disabled={state === "busy"}>
            {state === "busy" ? <Loader2  /> : null} Continue
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">New here? <Link to="/book" className="font-medium text-ink underline underline-offset-4">Start a new booking</Link></p>
      </div>
    </BookingShell>
  );
}
