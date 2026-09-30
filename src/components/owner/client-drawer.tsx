import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { ClientContent } from "./client-content";
import type { ClientDrawerTarget } from "./drawer-context";

export function ClientDrawer({ target, onClose }: { target: ClientDrawerTarget | null; onClose: () => void }) {
  return <Sheet open={!!target} onOpenChange={open => { if (!open) onClose(); }}>
    <SheetContent side="right" className="inset-x-0 bottom-0 top-auto h-[94dvh] w-full max-w-none overflow-y-auto rounded-t-2xl border-border bg-sheet p-5 sm:inset-y-0 sm:left-auto sm:h-full sm:w-[480px] sm:max-w-[480px] sm:rounded-none sm:rounded-l-2xl sm:p-6">
      <SheetTitle className="sr-only">Client details</SheetTitle>
      {target && <ClientContent id={target.clientId} appointmentId={target.appointmentId} />}
    </SheetContent>
  </Sheet>;
}
