import { useEffect, useState } from "react";
import { Check, CreditCard, Loader2, Lock } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tag } from "@/components/ui/tag";
import { Logo } from "@/components/brand/Logo";

const money = (c: number) => `$${(c / 100).toLocaleString("en-US", { minimumFractionDigits: c % 100 ? 2 : 0 })}`;

/**
 * The client's checkout. Laid out like a hosted card checkout (summary left, card right) so the demo shows the real moment.
 * Online payments aren't switched on yet, so the card fields hold a test card and are read-only: nothing typed here is sent anywhere.
 * When Stripe is connected this dialog is replaced by Stripe Checkout; the summary and the success state stay the same.
 */
export function Checkout({ open, onOpenChange, amountCents, item, email, onPay, onDone }: {
  open: boolean; onOpenChange: (o: boolean) => void; amountCents: number; item: string; email: string;
  onPay: () => Promise<boolean>; onDone: () => void;
}) {
  const [state, setState] = useState<"form" | "paying" | "paid" | "error">("form");
  useEffect(() => { if (open) setState("form"); }, [open]);
  const pay = async () => {
    setState("paying");
    try { const ok = await onPay(); setState(ok ? "paid" : "error"); } catch { setState("error"); }
  };
  return (
    <Dialog open={open} onOpenChange={(o) => { if (state !== "paying") { onOpenChange(o); if (!o && state === "paid") onDone(); } }}>
      <DialogContent className="max-w-[760px] gap-0 overflow-hidden p-0">
        {state === "paid" ? (
          <div className="px-6 py-12 text-center">
            <span className="enter-spot mx-auto grid size-12 place-items-center rounded-full bg-alert-success text-alert-success-fg"><Check className="size-5" strokeWidth={2.5} /></span>
            <DialogTitle className="mt-5 font-serif text-[28px] font-medium leading-9 tracking-[-0.02em]">Paid {money(amountCents)}.</DialogTitle>
            <DialogDescription className="mt-2 text-[15px]">Thank you. {email ? <>A receipt is on its way to {email}. </> : "A receipt is on its way to your inbox. "}Claire will file your return today.</DialogDescription>
            <Button size="lg" className="mt-7" onClick={() => { onOpenChange(false); onDone(); }}>Done</Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-[1fr_1.15fr]">
            <div className="border-b border-line-1 bg-surface-2 p-6 md:border-b-0 md:border-r">
              <Logo />
              <p className="mt-8 text-[13px] text-muted-foreground">Pay Hartwell Tax &amp; Bookkeeping</p>
              <p className="tabular mt-1 font-serif text-[36px] font-semibold leading-none tracking-[-0.02em] text-deep-ink">{money(amountCents)}</p>
              <dl className="mt-8 space-y-3 text-[13px]">
                <div className="flex justify-between gap-4"><dt className="text-deep-ink">{item}</dt><dd className="tabular text-deep-ink">{money(amountCents)}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Form 8879</dt><dd className="flex items-center gap-1 text-alert-success-fg"><Check className="size-3.5" />Signed</dd></div>
                <div className="flex justify-between gap-4 border-t border-line-1 pt-3 font-medium"><dt className="text-deep-ink">Total due</dt><dd className="tabular text-deep-ink">{money(amountCents)}</dd></div>
              </dl>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-2 pr-10">
                <DialogTitle>Pay with card</DialogTitle>
                <Tag tone="warning">Test mode</Tag>
              </div>
              <DialogDescription className="mt-1 text-[13px]">Online payments aren't switched on yet. This test card is filled in for you and no card is charged.</DialogDescription>
              <div className="mt-5 space-y-3">
                {email && <label className="block text-[13px] font-medium text-deep-ink">Email<Input readOnly tabIndex={-1} value={email} className="mt-1.5 bg-surface-2" /></label>}
                <div>
                  <span className="text-[13px] font-medium text-deep-ink">Card information</span>
                  <div className="mt-1.5 overflow-hidden rounded-lg border border-form-border">
                    <div className="flex items-center gap-2 border-b border-form-border bg-surface-2 px-3"><CreditCard className="size-4 text-muted-foreground" /><input readOnly tabIndex={-1} aria-label="Card number" value="4242 4242 4242 4242" className="tabular h-10 w-full bg-transparent text-sm text-deep-ink outline-none" /></div>
                    <div className="grid grid-cols-2 bg-surface-2"><input readOnly tabIndex={-1} aria-label="Expiry" value="12 / 34" className="tabular h-10 border-r border-form-border bg-transparent px-3 text-sm text-deep-ink outline-none" /><input readOnly tabIndex={-1} aria-label="CVC" value="123" className="tabular h-10 bg-transparent px-3 text-sm text-deep-ink outline-none" /></div>
                  </div>
                </div>
              </div>
              {state === "error" && <p role="alert" className="mt-3 text-[13px] text-alert-negative-fg">That didn't go through. Please try again.</p>}
              <Button size="lg" className="mt-5 w-full" disabled={state === "paying"} onClick={pay}>
                {state === "paying" ? <Loader2 className="animate-spin" /> : <Lock />}{state === "paying" ? "Processing…" : `Pay ${money(amountCents)}`}
              </Button>
              <p className="mt-3 text-center text-xs text-muted-foreground">Your return is filed as soon as the payment goes through.</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
