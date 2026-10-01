import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CalendarClock, Loader2, Mail, RotateCcw } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookingShell, ResultPanel, StepTitle } from "@/components/booking/BookingShell";
import { sendReturningLinks } from "@/lib/booking.functions";

export const Route = createFileRoute("/book/returning")({
  head: () => ({
    meta: [
      { title: "Your appointment — Hartwell Tax & Bookkeeping" },
      { name: "description", content: "See, move or cancel your appointment, or book again with last year's answers." },
      { property: "og:title", content: "Your appointment — Hartwell Tax & Bookkeeping" },
      { property: "og:description", content: "See, move or cancel your appointment, or book again." },
    ],
  }),
  component: ReturningPage,
});

function ReturningPage() {
  const send = useServerFn(sendReturningLinks);
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "sent" | "error">("idle");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("busy");
    try { await send({ data: { email } }); setState("sent"); } catch { setState("error"); }
  };

  return (
    <BookingShell>
      <div className="mx-auto max-w-md">
        {state === "sent" ? (
          <ResultPanel icon={<Mail />} tone="success" title="Check your inbox."
            actions={<><Button size="lg" variant="secondary" onClick={() => setState("idle")}><RotateCcw />Use a different email</Button><Button asChild size="lg" variant="ghost"><Link to="/book">Schedule a new appointment</Link></Button></>}>
            If <strong>{email}</strong> has booked with Claire, a private link is on its way. It opens your appointment, and lets you book again with last year's answers.
            <p className="mt-4 text-xs">Nothing after a few minutes? Check spam, or call (973) 555-0142.</p>
          </ResultPanel>
        ) : (
          <>
            <StepTitle hideEyebrow eyebrow="" title="Find your appointment" sub="Enter the email you booked with. We'll send you a private link." />
            <ul className="mb-6 space-y-3">
              <li className="flex items-start gap-3 text-sm text-body"><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-fill-neutral text-deep-ink"><CalendarClock className="size-4" /></span><span><span className="block font-medium text-deep-ink">Already booked?</span>See your appointment, upload documents, move or cancel it.</span></li>
              <li className="flex items-start gap-3 text-sm text-body"><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-fill-neutral text-deep-ink"><RotateCcw className="size-4" /></span><span><span className="block font-medium text-deep-ink">Coming back this year?</span>Your answers from last time come filled in.</span></li>
            </ul>
            <form onSubmit={submit} className="space-y-4 border-t border-line-1 pt-6">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => { setEmail(e.target.value); setState("idle"); }} className="h-11 bg-sheet" />
              </div>
              {state === "error" && <p className="text-sm text-destructive">Something went wrong. Please try again.</p>}
              <Button type="submit" size="lg" className="w-full" disabled={state === "busy"}>
                {state === "busy" && <Loader2 className="animate-spin" />} Email me my link
              </Button>
              <p className="text-center text-xs text-muted-foreground">For your privacy, we never show appointment details on this page.</p>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">New here? <Link to="/book" className="inline-flex min-h-10 items-center font-medium text-ink underline underline-offset-4">Schedule a new appointment</Link></p>
          </>
        )}
      </div>
    </BookingShell>
  );
}
