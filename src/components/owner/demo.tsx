import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ChevronLeft, ExternalLink, FlaskConical, Smartphone, X } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { EmailCard, parseEmailText } from "./email-preview";
import { LogoMark } from "@/components/brand/Logo";
import { demoAbandon, demoCancelTomorrow, demoClaim, demoClientPays, demoJump, demoPortalLink, demoFillWeek, demoPreventNoShow, demoReset, demoRun, demoUpload, demoWrongDoc, phoneFeed } from "@/lib/demo.functions";

type Msg = { id: string; channel: string; type: string; subject: string | null; body: string; sent_at: string; recipient: string | null; name: string | null };

const STORY: { title: string; actions: { k: string; label: string; hint: string; link?: boolean }[] }[] = [
  { title: "Set the scene", actions: [
    { k: "fill", label: "Fill this week with sample clients", hint: "Every state at once: missing documents, needs your eyes, ready, a free call, now, just ended, signature, payment, to file, filed, a no-show, a full day with a waitlist." },
  ] },
  { title: "A client books", actions: [
    { k: "book", label: "Open the booking page", hint: "Book as a client in a new tab. It appears in Today right away.", link: true },
    { k: "portal", label: "Open a client's appointment page", hint: "The page every confirmation email links to.", link: true },
  ] },
  { title: "Documents come in", actions: [
    { k: "up", label: "Client uploads a document", hint: "Checked and accepted automatically. Nothing lands on your desk." },
    { k: "wrong", label: "Client uploads last year's W-2", hint: "The AI warns the client. If they keep it anyway, only then does Claire look." },
  ] },
  { title: "Before the appointment", actions: [
    { k: "j1", label: "Jump ahead 1 day", hint: "Runs reminders and the 48-hour readiness check." },
    { k: "prevent", label: "A client who isn't ready moves later", hint: "Two days out with documents missing: offered later times, takes one. An empty chair avoided." },
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

export function DemoTools({ inline = false, rows = false, collapsed = false }: { inline?: boolean; rows?: boolean; collapsed?: boolean } = {}) {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const qc = useQueryClient();
  // The phone's "More" menu opens these from anywhere (the sidebar instance is always mounted).
  useEffect(() => {
    if (!rows) return;
    const o = () => setOpen(true), p = () => setPhone((v) => !v);
    window.addEventListener("owner:demo", o); window.addEventListener("owner:phone", p);
    return () => { window.removeEventListener("owner:demo", o); window.removeEventListener("owner:phone", p); };
  }, [rows]);
  const fns = {
    run: useServerFn(demoRun), jump: useServerFn(demoJump), upload: useServerFn(demoUpload),
    cancel: useServerFn(demoCancelTomorrow), claim: useServerFn(demoClaim), abandon: useServerFn(demoAbandon), reset: useServerFn(demoReset),
    wrong: useServerFn(demoWrongDoc), pays: useServerFn(demoClientPays), portal: useServerFn(demoPortalLink), prevent: useServerFn(demoPreventNoShow), fill: useServerFn(demoFillWeek),
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
    if (k === "portal") return act(k, async () => { const r = await fns.portal(); if (r.token) openTab(`/a/${r.token}`); return { message: r.token ? "Opened the client's appointment page in a new tab." : "No upcoming appointment to open." }; });
    const map: Record<string, () => Promise<{ message: string }>> = {
      run: () => fns.run(), prevent: () => fns.prevent(), fill: () => fns.fill(), j1: () => fns.jump({ data: { days: 1 } }), j2: () => fns.jump({ data: { days: 2 } }), j7: () => fns.jump({ data: { days: 7 } }),
      up: () => fns.upload(), wrong: () => fns.wrong(), cx: () => fns.cancel(), cl: () => fns.claim(), ab: () => fns.abandon(), pays: () => fns.pays(), rs: () => fns.reset(),
    };
    return act(k, map[k]!);
  };

  return (
    <>
      {rows ? (
        <div className="flex flex-col gap-0.5">
          {([[FlaskConical, "Demo tools", () => setOpen(true), false], [Smartphone, "Phone preview", () => setPhone((p) => !p), phone]] as const).map(([Icon, label, onClick, on]) => (
            <button key={label} type="button" onClick={onClick} aria-pressed={label === "Phone preview" ? on : undefined} title={collapsed ? label : undefined}
              className={`flex h-8 items-center gap-2.5 rounded-lg text-[13px] transition-colors duration-150 hover:bg-tint-1 ${collapsed ? "justify-center px-0" : "px-2"} ${on ? "bg-tint-2 font-medium text-deep-ink" : "text-muted-foreground"}`}>
              <Icon className="size-4 shrink-0" strokeWidth={1.75} />{!collapsed && label}
            </button>
          ))}
        </div>
      ) : (
      <div className={inline ? "flex gap-2" : "fixed bottom-20 right-5 z-40 flex gap-2"}>
        <Button size="icon" variant={phone ? "dark" : "secondary"} onClick={() => setPhone((p) => !p)} aria-pressed={phone} aria-label="Phone preview" className={inline ? "size-8 rounded-lg" : "h-11 w-11 rounded-full"}>
          <Smartphone className="h-4 w-4" />
        </Button>
        <Button variant={inline ? "secondary" : "default"} onClick={() => setOpen(true)} className={inline ? "h-8 flex-1 gap-2 rounded-lg px-3 text-xs" : "h-11 gap-2 rounded-full px-4 text-sm"}>
          <FlaskConical className="h-4 w-4" /> {inline ? "Demo tools" : "Demo"}
        </Button>
      </div>
      )}

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

      {/* Portal to <body>: the sidebar is sticky (its own stacking context), so a fixed child would sit under the page. */}
      {phone && typeof document !== "undefined" && createPortal(<PhonePanel onClose={() => setPhone(false)} />, document.body)}
    </>
  );
}

function PhonePanel({ onClose }: { onClose: () => void }) {
  const feed = useServerFn(phoneFeed);
  const q = useQuery({ queryKey: ["owner", "phone"], queryFn: () => feed() as Promise<Msg[]>, refetchInterval: 3000 });
  // Never let an unexpected response take the page down; the preview just stays empty.
  const data: Msg[] = Array.isArray(q.data) ? q.data : [];
  const [pick, setPick] = useState<string>("latest");
  const [tab, setTab] = useState<"mail" | "sms">("mail");
  const [open, setOpen] = useState<string | null>(null);
  const people = useMemo(() => {
    const m = new Map<string, string>();
    for (const x of data) if (x.recipient && !m.has(x.recipient)) m.set(x.recipient, x.name ?? x.recipient);
    return [...m.entries()].slice(0, 40);
  }, [data]);
  const who = pick === "latest" ? people[0]?.[0] : pick;
  const mine = data.filter((x) => x.recipient === who || (x.channel === "sms" && x.name && x.name === people.find((p) => p[0] === who)?.[1]));
  const mails = mine.filter((x) => x.channel !== "sms");
  const texts = mine.filter((x) => x.channel === "sms").slice(0, 20).reverse();
  const name = people.find((p) => p[0] === who)?.[1];
  const current = mails.find((m) => m.id === open);
  const stamp = (iso: string) => new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/New_York" });
  const linkify = (t: string) => t.split(/(https?:\/\/\S+)/g).map((part, i) => /^https?:\/\//.test(part) ? <a key={i} href={part} target="_blank" rel="noreferrer" className="break-all text-[#0A84FF] underline">{part}</a> : part);

  return (
    <aside aria-label="Phone preview" className="enter fixed bottom-24 right-5 z-40 w-[330px] sm:bottom-6">
      <div className="mb-2 flex items-center gap-2 rounded-2xl border border-line-1 bg-white/90 p-1.5 shadow-[0_0_2px_rgba(18,18,18,0.08),0_9px_5px_rgba(18,18,18,0.02),0_4px_4px_rgba(18,18,18,0.04)] backdrop-blur-lg">
        <select value={pick} onChange={(e) => { setPick(e.target.value); setOpen(null); }} aria-label="Whose phone"
          className="h-8 min-w-0 flex-1 cursor-pointer rounded-lg bg-transparent px-2 text-[13px] text-deep-ink outline-none hover:bg-tint-1">
          <option value="latest">{name ? `${name} (latest message)` : "Latest message"}</option>
          {people.map(([r, n]) => <option key={r} value={r}>{n}</option>)}
        </select>
        <Button onClick={onClose} aria-label="Close phone preview" size="icon" variant="ghost"><X /></Button>
      </div>
      <div className="rounded-[52px] bg-[#111] p-[10px] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.45)] ring-1 ring-black/40">
        <div className="relative flex h-[620px] flex-col overflow-hidden rounded-[42px] bg-white">
          <div className="relative flex h-11 shrink-0 items-center justify-between px-7 text-[13px] font-semibold text-black">
            <span className="tabular">9:41</span>
            <span className="absolute left-1/2 top-2.5 h-[26px] w-[92px] -translate-x-1/2 rounded-full bg-black" />
            <span className="flex items-center gap-1"><span className="flex items-end gap-[2px]">{[4, 6, 8, 10].map((h) => <span key={h} className="w-[3px] rounded-sm bg-black" style={{ height: h }} />)}</span><span className="ml-1 h-[11px] w-[22px] rounded-[3px] border border-black/60 p-[1px]"><span className="block h-full w-3/4 rounded-[1px] bg-black" /></span></span>
          </div>

          {current ? (
            <>
              <div className="flex h-11 shrink-0 items-center gap-1 border-b border-black/10 px-3">
                <button type="button" onClick={() => setOpen(null)} className="flex items-center gap-0.5 text-[15px] text-[#0A84FF]"><ChevronLeft className="size-5" />Inbox</button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="px-4 pb-3 pt-3">
                  <p className="text-[17px] font-semibold leading-snug text-black">{current.subject}</p>
                  <div className="mt-3 flex items-center gap-2.5">
                    <LogoMark size={32} />
                    <div className="min-w-0 text-[12px] leading-4"><p className="font-semibold text-black">Claire Hartwell, EA</p><p className="truncate text-black/50">To: {name} · {stamp(current.sent_at)}</p></div>
                  </div>
                </div>
                {(() => { const e = parseEmailText(current.body ?? ""); return <EmailCard compact heading={e.heading} blocks={e.blocks} />; })()}
                <SendCopy id={current.id} />
              </div>
            </>
          ) : (
            <>
              <div className="shrink-0 px-4 pb-2">
                <p className="text-[28px] font-bold leading-9 tracking-[-0.02em] text-black">{tab === "mail" ? "Inbox" : "Messages"}</p>
                <div className="mt-2 grid grid-cols-2 rounded-lg bg-black/[0.06] p-0.5 text-[13px] font-medium">
                  {(["mail", "sms"] as const).map((t) => <button key={t} type="button" onClick={() => setTab(t)} className={`h-7 rounded-md transition-colors duration-150 ${tab === t ? "bg-white text-black shadow-sm" : "text-black/60"}`}>{t === "mail" ? `Mail (${mails.length})` : `Texts (${texts.length})`}</button>)}
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">
                {tab === "mail" ? (
                  mails.length === 0 ? <p className="px-6 pt-16 text-center text-[13px] text-black/50">Emails appear here as they're sent. Try a step in Demo tools.</p> : (
                    <ul className="divide-y divide-black/10 border-t border-black/10">
                      {mails.map((m, i) => (
                        <li key={m.id}>
                          <button type="button" onClick={() => setOpen(m.id)} className="flex w-full gap-2.5 px-4 py-3 text-left transition-colors duration-150 hover:bg-black/[0.03]">
                            <span className={`mt-1.5 size-2 shrink-0 rounded-full ${i === 0 ? "bg-[#0A84FF]" : "bg-transparent"}`} />
                            <span className="min-w-0 flex-1">
                              <span className="flex items-baseline justify-between gap-2"><span className="truncate text-[14px] font-semibold text-black">Claire Hartwell, EA</span><span className="tabular shrink-0 text-[11px] text-black/45">{stamp(m.sent_at).split(",")[0]}</span></span>
                              <span className="block truncate text-[13px] text-black">{m.subject}</span>
                              <span className="line-clamp-2 text-[12.5px] leading-[17px] text-black/50">{(m.body ?? "").split(/\n\n+/).slice(1, 2).join(" ")}</span>
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )
                ) : (
                  texts.length === 0 ? <p className="px-6 pt-16 text-center text-[13px] text-black/50">Text messages appear here for clients who gave a phone number.</p> : (
                    <div className="space-y-3 px-3 pb-4 pt-2">
                      <p className="text-center text-[11px] text-black/45">Hartwell Tax · Text message</p>
                      {texts.map((m) => (
                        <div key={m.id}>
                          <div className="max-w-[82%] rounded-[18px] rounded-bl-md bg-[#E9E9EB] px-3 py-2 text-[14px] leading-[19px] text-black [overflow-wrap:anywhere]">{linkify(m.body ?? "")}</div>
                          <p className="tabular mt-1 px-1 text-[10px] text-black/40">{stamp(m.sent_at)}</p>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            </>
          )}
          <span className="absolute bottom-2 left-1/2 h-[5px] w-[120px] -translate-x-1/2 rounded-full bg-black" />
        </div>
      </div>
    </aside>
  );
}
