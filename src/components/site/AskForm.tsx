import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { submitInquiry } from "@/lib/inquiry.functions";

export function AskForm({ className = "" }: { className?: string }) {
  const send = useServerFn(submitInquiry);
  const [f, setF] = useState({ name: "", email: "", question: "" });
  const [state, setState] = useState<"idle" | "sending" | "error">("idle");
  const [done, setDone] = useState<{ auto: boolean; reply: string | null } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("sending");
    try {
      const r = await send({ data: f });
      if (!r.ok) throw new Error();
      setDone({ auto: r.auto, reply: r.reply }); setState("idle");
    } catch { setState("error"); }
  };

  if (done) return (
    <div className={`rounded-2xl border border-border bg-surface-1 p-5 ${className}`} role="status">
      <div className="flex items-center gap-2 text-sm font-medium text-deep-ink"><span className="grid size-6 place-items-center rounded-full bg-success text-primary-foreground"><Check className="size-3.5" /></span>{done.auto ? "Here's your answer" : "Thanks, Claire has your question"}</div>
      <p className="mt-3 whitespace-pre-line text-sm leading-[22px] text-body">{done.auto ? done.reply : "She'll reply by email, usually within one business day. Please don't send your Social Security number or account numbers."}</p>
      {done.auto && <p className="mt-3 text-xs text-muted-foreground">A copy is on its way to {f.email}.</p>}
      <Button variant="ghost" size="sm" className="mt-3" onClick={() => { setDone(null); setF({ ...f, question: "" }); }}>Ask something else</Button>
    </div>
  );

  return (
    <form onSubmit={submit} className={`grid gap-3 rounded-2xl border border-border bg-surface-1 p-5 ${className}`}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5"><Label htmlFor="ask-name">Name</Label><Input id="ask-name" required maxLength={100} autoComplete="name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
        <div className="grid gap-1.5"><Label htmlFor="ask-email">Email</Label><Input id="ask-email" type="email" required maxLength={200} autoComplete="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
      </div>
      <div className="grid gap-1.5"><Label htmlFor="ask-q">Your question</Label><Textarea id="ask-q" required minLength={5} maxLength={2000} rows={4} value={f.question} onChange={(e) => setF({ ...f, question: e.target.value })} /></div>
      <p className="text-xs text-muted-foreground">Please don't include your Social Security number or account numbers.</p>
      {state === "error" && <p className="text-sm text-destructive">Couldn't send that. Try again, or call (973) 555-0142.</p>}
      <Button type="submit" disabled={state === "sending"} className="justify-self-start">{state === "sending" ? "Sending…" : "Send question"}</Button>
    </form>
  );
}
