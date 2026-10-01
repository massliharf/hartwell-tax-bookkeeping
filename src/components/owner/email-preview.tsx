import { LogoMark } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";

export type PreviewBlock = { p: string } | { list: string[] } | { button: { label: string; href?: string } } | { note: string };

/** Turns the plain-text copy of a sent email (see toText in email.server.ts) back into blocks. */
export function parseEmailText(body: string): { heading: string; blocks: PreviewBlock[] } {
  const parts = body.split(/\n\n+/).map((s) => s.trim()).filter(Boolean);
  const heading = parts.shift() ?? "";
  if (parts.at(-1) === "Claire Hartwell, EA") parts.pop();
  const blocks: PreviewBlock[] = [];
  for (const part of parts) {
    const lines = part.split("\n");
    if (lines.every((l) => l.startsWith("- "))) { blocks.push({ list: lines.map((l) => l.slice(2)) }); continue; }
    const buttons = lines.map((l) => l.match(/^(.+?): (https?:\/\/\S+)$/));
    if (buttons.every(Boolean)) { for (const m of buttons) blocks.push({ button: { label: m![1]!, href: m![2]! } }); continue; }
    blocks.push({ p: part });
  }
  return { heading, blocks };
}

/**
 * The client's email exactly as it looks in their inbox (same layout as renderEmail in email.server.ts).
 * Used for the live preview when Claire finishes an appointment, and in the phone preview.
 */
export function EmailCard({ heading, blocks, compact = false, className }: { heading: string; blocks: PreviewBlock[]; compact?: boolean; className?: string }) {
  return (
    <div className={cn("bg-canvas", compact ? "px-3 py-4" : "rounded-xl p-4", className)}>
      <div className="mb-3 flex items-center gap-2 px-1">
        <LogoMark size={20} />
        <span className="text-[12px] font-semibold text-deep-ink">Hartwell <span className="font-normal text-muted-foreground">Tax &amp; Bookkeeping</span></span>
      </div>
      <div className={cn("rounded-2xl border border-line-0 bg-white", compact ? "p-4" : "p-5")}>
        <p className={cn("font-serif font-semibold leading-tight tracking-[-0.01em] text-deep-ink", compact ? "text-[18px]" : "text-[20px]")}>{heading}</p>
        <div className="mt-3 space-y-3">
          {blocks.map((b, i) =>
            "p" in b ? <p key={i} className="text-[13px] leading-5 text-body">{b.p}</p>
            : "note" in b ? <p key={i} className="text-[12px] leading-5 text-muted-foreground">{b.note}</p>
            : "list" in b ? (
              <ul key={i} className="divide-y divide-line-1 overflow-hidden rounded-lg border border-line-1">
                {b.list.map((x) => <li key={x} className="flex items-center gap-2 px-3 py-2 text-[12.5px] text-deep-ink"><span className="size-1.5 rounded-full bg-[#E7AD16]" />{x}</li>)}
              </ul>
            ) : b.button.href
              ? <a key={i} href={b.button.href} target="_blank" rel="noreferrer" className="block rounded-lg bg-ink px-4 py-2.5 text-center text-[13px] font-semibold text-white hover:bg-ink-hover">{b.button.label}</a>
              : <span key={i} className="block rounded-lg bg-ink px-4 py-2.5 text-center text-[13px] font-semibold text-white">{b.button.label}</span>,
          )}
        </div>
        <p className="mt-4 text-[12.5px] leading-5 text-body">Warmly,<br /><span className="font-semibold text-deep-ink">Claire Hartwell, EA</span></p>
      </div>
    </div>
  );
}
