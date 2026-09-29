import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AnimatePresence, motion } from "framer-motion";
import { FlaskConical, Mail, Smartphone, X } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { demoAbandon, demoCancelTomorrow, demoClaim, demoJump, demoReset, demoRun, demoUpload, phoneFeed } from "@/lib/demo.functions";

type Msg = { id: string; channel: string; type: string; subject: string | null; body: string; sent_at: string; recipient: string | null; name: string | null };

export function DemoTools() {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const qc = useQueryClient();
  const fns = {
    run: useServerFn(demoRun), jump: useServerFn(demoJump), upload: useServerFn(demoUpload),
    cancel: useServerFn(demoCancelTomorrow), claim: useServerFn(demoClaim), abandon: useServerFn(demoAbandon), reset: useServerFn(demoReset),
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

  const Row = ({ k, label, fn, variant = "outline" }: { k: string; label: string; fn: () => Promise<{ message: string }>; variant?: "outline" | "default" }) => (
    <Button variant={variant} className="w-full justify-start" disabled={!!busy} onClick={() => act(k, fn)}>
      {busy === k ? "Working…" : label}
    </Button>
  );

  return (
    <>
      <div className="fixed bottom-20 right-5 z-40 sm:bottom-5 flex gap-2">
        <button onClick={() => setPhone((p) => !p)} aria-pressed={phone} aria-label="Phone preview"
          className={`grid h-11 w-11 place-items-center rounded-full border border-border transition-colors ${phone ? "bg-ink text-primary-foreground" : "bg-sheet text-ink hover:bg-fill-subtle"}`}>
          <Smartphone className="h-4 w-4" />
        </button>
        <button onClick={() => setOpen(true)} className="flex h-11 items-center gap-2 rounded-full bg-ink px-4 text-sm text-primary-foreground">
          <FlaskConical className="h-4 w-4" /> Demo
        </button>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="overflow-y-auto bg-paper">
          <SheetHeader>
            <SheetTitle className="font-serif text-2xl font-normal">Test controls</SheetTitle>
            <SheetDescription>Show the follow-through live. Only you can see this.</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-6">
            <section className="space-y-2">
              <Row k="run" label="Run automations now" variant="default" fn={() => fns.run()} />
            </section>
            <section className="space-y-2">
              <h3 className="text-xs uppercase tracking-wide text-muted-foreground">Jump forward</h3>
              <div className="grid grid-cols-3 gap-2">
                {([1, 2, 7] as const).map((d) => (
                  <Button key={d} variant="outline" disabled={!!busy} onClick={() => act(`j${d}`, () => fns.jump({ data: { days: d } }))}>
                    {busy === `j${d}` ? "…" : `+${d} day${d > 1 ? "s" : ""}`}
                  </Button>
                ))}
              </div>
            </section>
            <section className="space-y-2">
              <h3 className="text-xs uppercase tracking-wide text-muted-foreground">Simulate</h3>
              <Row k="up" label="Client uploads a document" fn={() => fns.upload()} />
              <Row k="cx" label="Client cancels an appointment tomorrow" fn={() => fns.cancel()} />
              <Row k="cl" label="Waitlist client claims the slot" fn={() => fns.claim()} />
              <Row k="ab" label="Abandoned booking" fn={() => fns.abandon()} />
            </section>
            <section className="border-t border-border pt-4">
              <Row k="rs" label="Reset demo data" fn={() => fns.reset()} />
            </section>
          </div>
        </SheetContent>
      </Sheet>

      <AnimatePresence>{phone && <PhonePanel onClose={() => setPhone(false)} />}</AnimatePresence>
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
    <motion.aside initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }}
      className="fixed bottom-36 right-5 z-40 w-[300px] sm:bottom-20">
      <div className="mb-2 flex items-center gap-2">
        <select value={pick} onChange={(e) => setPick(e.target.value)} aria-label="Client"
          className="h-9 min-w-0 flex-1 rounded-full border border-border bg-sheet px-3 text-sm">
          <option value="latest">Follow latest message</option>
          {people.map(([r, n]) => <option key={r} value={r}>{n}</option>)}
        </select>
        <button onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full bg-sheet"><X className="h-4 w-4" /></button>
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
            <AnimatePresence initial={false}>
              {thread.map((m) => (
                <motion.div key={m.id} layout initial={{ opacity: 0, y: 12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}>
                  {m.channel === "sms" ? (
                    <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-fill-neutral px-3 py-2 text-[13px] leading-snug text-deep-ink [overflow-wrap:anywhere]">{m.body}</div>
                  ) : (
                    <div className="rounded-2xl bg-surface-2 p-3">
                      <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><Mail className="h-3 w-3" /> Email</p>
                      <p className="mt-1 font-serif text-[15px] leading-tight text-ink">{m.subject}</p>
                      <p className="mt-1 line-clamp-3 text-[12px] leading-snug text-deep-ink/75">{m.body}</p>
                    </div>
                  )}
                  <p className="tabular mt-1 px-1 text-[10px] text-muted-foreground">
                    {new Date(m.sent_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/New_York" })}
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}
