import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowUpRight, CalendarClock, Loader2, Mail, RotateCcw } from "lucide-react";
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
      { name: "description", content: "See, move or cancel your appointment, or schedule again with last year's answers." },
      { property: "og:title", content: "Your appointment — Hartwell Tax & Bookkeeping" },
      { property: "og:description", content: "See, move or cancel your appointment, or schedule again." },
    ],
  }),
  component: ReturningPage,
});

type Demo = { appointments: { label: string; token: string }[]; resumeId: string | null };

function ReturningPage() {
  const send = useServerFn(sendReturningLinks);
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "sent" | "error">("idle");
  const [demo, setDemo] = useState<Demo | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("busy");
    try {
      const res = (await send({ data: { email } })) as { demo?: Demo };
      setDemo(res.demo ?? null);
      setState("sent");
    } catch { setState("error"); }
  };

  return (
    <BookingShell>
      <div className={`mx-auto ${state === "sent" && demo ? "max-w-xl" : "max-w-md"}`}>
        {state === "sent" && demo ? (
          <div className="py-6 sm:py-10">
            <span className="grid size-12 place-items-center rounded-full bg-alert-success text-alert-success-fg"><Mail className="size-5" /></span>
            <h1 className="mt-5 t-page text-deep-ink">Welcome back.</h1>
            <p className="mt-2 text-[15px] leading-6 text-muted-foreground">Demo address, so here are the links from the email.</p>
            <div className="mt-8 space-y-3">
              {demo.appointments.map((a) => {
                const separator = a.label.indexOf(", ");
                const service = separator < 0 ? a.label : a.label.slice(0, separator);
                const date = separator < 0 ? "" : a.label.slice(separator + 2);
                return (
                  <Button key={a.token} asChild variant="outline" className="h-auto min-h-20 w-full justify-start gap-4 rounded-2xl border-line-1 bg-sheet px-5 py-4 text-left hover:border-line-2 hover:bg-surface-2 max-sm:min-h-20">
                    <Link to="/a/$token" params={{ token: a.token }}>
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-alert-info text-alert-info-fg"><CalendarClock className="size-5" /></span>
                      <span className="min-w-0 flex-1 whitespace-normal">
                        <span className="block text-[15px] font-semibold leading-5 text-deep-ink">{service}</span>
                        {date && <span className="mt-1 block text-[13px] font-normal leading-5 text-muted-foreground">{date}</span>}
                      </span>
                      <ArrowUpRight className="size-4 shrink-0 text-ink" />
                    </Link>
                  </Button>
                );
              })}
              {demo.resumeId && (
                <Button asChild size="lg" variant="secondary" className="h-auto min-h-12 w-full whitespace-normal px-5 py-3 text-center leading-5">
                  <Link to="/book" search={{ resume: demo.resumeId } as never}>Schedule again with last year's answers</Link>
                </Button>
              )}
            </div>
            <Button size="lg" variant="ghost" className="mt-3 w-full text-muted-foreground" onClick={() => { setState("idle"); setDemo(null); }}><RotateCcw />Use a different email</Button>
          </div>
        ) : state === "sent" ? (
          <ResultPanel icon={<Mail />} tone="success" title="Check your inbox."
            actions={<><Button size="lg" variant="secondary" onClick={() => setState("idle")}><RotateCcw />Use a different email</Button><Button asChild size="lg" variant="ghost"><Link to="/book">Schedule a new appointment</Link></Button></>}>
            If <strong>{email}</strong> has an appointment with us, a private link is on its way.
            <p className="mt-4 text-xs">Nothing after a few minutes? Check spam, or call (973) 555-0142.</p>
          </ResultPanel>
        ) : (
          <>
            <StepTitle hideEyebrow eyebrow="" title="Find your appointment" sub="Enter the email you used to schedule. We'll email you a private link to your appointment." />
            <ul className="mb-6 space-y-3">
              <li className="flex items-start gap-3 text-sm text-body"><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-fill-neutral text-deep-ink"><CalendarClock className="size-4" /></span><span><span className="block font-medium text-deep-ink">Have an appointment?</span>See it, upload documents, or move or cancel it.</span></li>
              <li className="flex items-start gap-3 text-sm text-body"><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-fill-neutral text-deep-ink"><RotateCcw className="size-4" /></span><span><span className="block font-medium text-deep-ink">Coming back this year?</span>Schedule again with last year's answers already filled in.</span></li>
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
