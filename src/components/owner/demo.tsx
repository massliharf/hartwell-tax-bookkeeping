import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ExternalLink, FlaskConical, Mail, Smartphone, X } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { demoAbandon, demoCancelTomorrow, demoClaim, demoClientPays, demoJump, demoPortalLink, demoReset, demoRun, demoUpload, demoWrongDoc, phoneFeed } from "@/lib/demo.functions";

type Msg = { id: string; channel: string; type: string; subject: string | null; body: string; sent_at: string; recipient: string | null; name: string | null };

const STORY: { title: string; actions: { k: string; label: string; hint: string; link?: boolean }[] }[] = [
  { title: "A client books", actions: [
    { k: "book", label: "Open the booking page", hint: "Book as a client in a new tab. It appears in Today right away.", link: true },
    { k: "portal", label: "Open a client's private page", hint: "The page every confirmation email links to.", link: true },
  ] },
  { title: "Documents come in", actions: [
    { k: "up", label: "Client uploads a document", hint: "Checked and accepted automatically. Nothing lands on your desk." },
    { k: "wrong", label: "Client uploads last year's W-2", hint: "The AI warns the client. If they keep it anyway, only then does Claire look." },
  ] },
  { title: "Before the appointment", actions: [
    { k: "j1", label: "Jump ahead 1 day", hint: "Runs reminders and the 48-hour readiness check." },
    { k: "j7", label: "Jump ahead 7 days", hint: "Sends document reminders for next week's clients." },
    { k: "run", label: "Run automations now", hint: "Sends anything due. Nothing is ever sent twice." },
  ] },
  { title: "Someone cancels", actions: [
    { k: "cx", label: "A client cancels tomorrow", hint: "The waitlist is offered the freed slot by email." },
    { k: "cl", label: "Waitlist client claims it", hint: "The slot refills with no work from Claire." },
    { k: "ab", label: "Someone leaves a booking half-done", hint: "A friendly nudge goes out an hour later." },
  ] },
  { title: "After the appointment", actions: [
    { k: "pays", label: "Client signs and pays", hint: "Use after Finish appointment. The return moves to Ready to file." },
  ] },
];

export function DemoTools({ inline = false }: { inline?: boolean } = {}) {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const qc = useQueryClient();
  const fns = {
    run: useServerFn(demoRun), jump: useServerFn(demoJump), upload: useServerFn(demoUpload),
    cancel: useServerFn(demoCancelTomorrow), claim: useServerFn(demoClaim), abandon: useServerFn(demoAbandon), reset: useServerFn(demoReset),
    wrong: useServerFn(demoWrongDoc), pays: useServerFn(demoClientPays), portal: useServerFn(demoPortalLink),
  };

  const act = async (key: string, fn: () => Promise<{ message: string }>) => {
    setBusy(key);
    try {
      const r = await fn();
      toast.success(r.message);
    } catch {
      toast.error("That didn't work. Please try again.");
    } finally {
      setBusy(null);
      await qc.invalidateQueries();
    }
  };


  const openTab = (url: string) => window.open(url, "_blank", "noopener");
  const run = (k: string) => {
    if (k === "book") return openTab("/book");
    if (k === "portal") return act(k, async () => { const r = await fns.portal(); if (r.token) openTab(`/a/${r.token}`); return { message: r.token ? "Opened the client's private page in a new tab." : "No upcoming appointment to open." }; });
    const map: Record<string, () => Promise<{ message: string }>> = {
      run: () => fns.run(), j1: () => fns.jump({ data: { days: 1 } }), j2: () => fns.jump({ data: { days: 2 } }), j7: () => fns.jump({ data: { days: 7 } }),
      up: () => fns.upload(), wrong: () => fns.wrong(), cx: () => fns.cancel(), cl: () => fns.claim(), ab: () => fns.abandon(), pays: () => fns.pays(), rs: () => fns.reset(),
    };
    return act(k, map[k]!);
  };

  return (
    <>
      <div className={inline ? "flex gap-2" : "fixed bottom-20 right-5 z-40 flex gap-2"}>
        <Button size="icon" variant={phone ? "default" : "secondary"} onClick={() => setPhone((p) => !p)} aria-pressed={phone} aria-label="Phone preview" className={inline ? "size-8 rounded-lg" : "h-11 w-11 rounded-full"}>
          <Smartphone className="h-4 w-4" />
        </Button>
        <Button variant={inline ? "secondary" : "default"} onClick={() => setOpen(true)} className={inline ? "h-8 flex-1 gap-2 rounded-lg px-3 text-xs" : "h-11 gap-2 rounded-full px-4 text-sm"}>
          <FlaskConical className="h-4 w-4" /> {inline ? "Demo tools" : "Demo"}
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="t-owner">Test controls</DialogTitle>
            <DialogDescription>Walk through a whole season in a few clicks. Only you can see this.</DialogDescription>
          </DialogHeader>
          <ol className="space-y-5">
            {STORY.map((step, n) => (
              <li key={step.title}>
                <p className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground"><span className="tabular grid size-5 place-items-center rounded-full bg-fill-neutral text-[11px] text-deep-ink">{n + 1}</span>{step.title}</p>
                <ul className="divide-y divide-border rounded-xl border border-border">
                  {step.actions.map((x) => (
                    <li key={x.k} className="flex items-center gap-3 px-3 py-2.5">
                      <span className="min-w-0 flex-1"><span className="block text-sm text-deep-ink">{x.label}</span><span className="block text-xs text-muted-foreground">{x.hint}</span></span>
                      <Button size="sm" variant="secondary" disabled={!!busy} onClick={() => run(x.k)}>{busy === x.k ? "Working…" : x.link ? <><ExternalLink />Open</> : "Run"}</Button>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
          <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
            <span className="text-xs text-muted-foreground">Puts every appointment, message and document back to the start.</span>
            <Button size="sm" variant="secondary" className="text-destructive" disabled={!!busy} onClick={() => run("rs")}>{busy === "rs" ? "Resetting…" : "Reset demo data"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {phone && <PhonePanel onClose={() => setPhone(false)} />}
    </>
  );
}

function PhonePanel({ onClose }: { onClose: () => void }) {
  const feed = useServerFn(phoneFeed);
  const { data = [] } = useQuery({ queryKey: ["owner", "phone"], queryFn: () => feed() as Promise<Msg[]>, refetchInterval: 3000 });
  const [pick, setPick] = useState<string>("latest");
  const people = useMemo(() => {
    const m = new Map<string, string>();
    for (const x of data) if (x.recipient && !m.has(x.recipient)) m.set(x.recipient, x.name ?? x.recipient);
    return [...m.entries()].slice(0, 40);
  }, [data]);
  const who = pick === "latest" ? people[0]?.[0] : pick;
  const thread = data.filter((x) => x.recipient === who).slice(0, 12).reverse();
  const name = people.find((p) => p[0] === who)?.[1];

  return (
    <aside
      className="fixed bottom-36 right-5 z-40 w-[300px] sm:bottom-20">
      <div className="mb-2 flex items-center gap-2">
        <select value={pick} onChange={(e) => setPick(e.target.value)} aria-label="Client"
          className="h-9 min-w-0 flex-1 rounded-full border border-border bg-sheet px-3 text-sm">
          <option value="latest">Follow latest message</option>
          {people.map(([r, n]) => <option key={r} value={r}>{n}</option>)}
        </select>
        <Button onClick={onClose} aria-label="Close" size="icon" variant="secondary" className="h-9 w-9 rounded-full"><X className="h-4 w-4" /></Button>
      </div>
      <div className="rounded-[44px] bg-deep-ink p-2.5">
        <div className="relative h-[540px] overflow-hidden rounded-[36px] bg-paper">
          <div className="absolute left-1/2 top-2 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-deep-ink" />
          <div className="border-b border-border bg-sheet px-4 pb-2 pt-9 text-center">
            <p className="truncate text-sm font-medium text-deep-ink">{name ?? "No messages yet"}</p>
            <p className="text-[11px] text-muted-foreground">From Claire Hartwell, EA</p>
          </div>
          <div className="h-[calc(100%-68px)] space-y-3 overflow-y-auto px-3 py-4">
            {thread.length === 0 && <p className="pt-20 text-center text-sm text-muted-foreground">Messages will appear here as automations run.</p>}
            
              {thread.map((m) => (
                <div key={m.id}>
                  {m.channel === "sms" ? (
                    <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-fill-neutral px-3 py-2 text-[13px] leading-snug text-deep-ink [overflow-wrap:anywhere]">{m.body}</div>
                  ) : (
                    <div className="rounded-2xl bg-surface-2 p-3">
                      <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><Mail className="h-3 w-3" /> Email</p>
                      <p className="mt-1 font-sans text-[15px] leading-tight text-deep-ink">{m.subject}</p>
                      <p className="mt-1 line-clamp-3 text-[12px] leading-snug text-deep-ink/75">{m.body}</p>
                    </div>
                  )}
                  <p className="tabular mt-1 px-1 text-[10px] text-muted-foreground">
                    {new Date(m.sent_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/New_York" })}
                  </p>
                </div>
              ))}
            
          </div>
        </div>
      </div>
    </aside>
  );
}
