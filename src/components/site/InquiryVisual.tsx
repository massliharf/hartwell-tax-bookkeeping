import { Check, FileText, MessageCircle } from "lucide-react";
import { ReadyRing } from "@/components/brand/ReadyRing";

/**
 * The brief in one picture: an inbound "can I book with you?" turns into "you're booked".
 * Plays once: the message arrives, then the confirmation lands with its checklist.
 */
export function InquiryVisual() {
  const docs = [["W-2", "From your employer"], ["1098", "Mortgage interest"], ["Photo ID", "A phone photo is fine"]] as const;
  return (
    <div className="relative mx-auto w-full max-w-[440px] py-6 sm:py-10">
      <div className="enter-item max-w-[300px]" style={{ animationDelay: "250ms" }}>
        <p className="mb-1.5 flex items-center gap-1.5 pl-1 text-[11px] font-medium text-muted-foreground"><MessageCircle className="size-3.5" />Text to Claire · 9:12 PM</p>
        <div className="rounded-[20px] rounded-bl-md bg-sheet px-4 py-3 text-[15px] leading-[21px] text-deep-ink shadow-[0_1px_2px_rgba(44,20,10,0.06)]">
          Hi! Can you do my taxes before the Oct 15 deadline? Tuesdays are hard for me.
        </div>
      </div>

      <div className="enter-item my-3 ml-8 flex items-center gap-2 text-[11px] font-medium text-muted-foreground" style={{ animationDelay: "700ms" }}>
        <span className="h-6 w-px bg-line-2" />Booked online in 2 minutes, no call back
      </div>

      <div className="enter-spot ml-auto w-full max-w-[380px] rounded-[22px] border border-line-1 bg-sheet p-5 shadow-[0_24px_48px_-24px_rgba(44,20,10,0.28)]" style={{ animationDelay: "1000ms" }}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[12px] font-medium text-alert-success-fg"><Check className="size-3.5" strokeWidth={2.5} />You're booked</p>
            <p className="mt-1 font-serif text-[22px] font-semibold leading-7 tracking-[-0.02em] text-deep-ink">Thursday, 10:30 am</p>
            <p className="text-[13px] text-muted-foreground">Individual return · In person</p>
          </div>
          <ReadyRing value={67} size={64} stroke={5} />
        </div>
        <ul className="mt-4 space-y-2">
          {docs.map(([name, hint], i) => (
            <li key={name} className="enter-item flex items-center gap-3 rounded-xl border border-line-1 px-3 py-2" style={{ animationDelay: `${1300 + i * 120}ms` }}>
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-canvas text-deep-ink"><FileText className="size-4" /></span>
              <span className="min-w-0 flex-1"><span className="block text-[13px] font-medium text-deep-ink">{name}</span><span className="block text-[11px] text-muted-foreground">{hint}</span></span>
              {i < 2 ? <span className="grid size-5 place-items-center rounded-full bg-success text-white"><Check className="size-3" strokeWidth={3} /></span> : <span className="size-5 rounded-full border-2 border-dashed border-line-2" />}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[11px] text-muted-foreground">Reminders go out on their own until everything is in.</p>
      </div>
    </div>
  );
}
