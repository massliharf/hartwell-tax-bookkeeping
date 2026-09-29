import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, Loader2, Lock, Upload } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ReadyRing } from "@/components/brand/ReadyRing";
import { BookingShell } from "@/components/booking/BookingShell";
import { confirmUpload, createUploadUrl, getAppointmentByToken } from "@/lib/portal.functions";
import { fmtDateLong, fmtTime } from "@/lib/intake";

export const Route = createFileRoute("/manage/$token")({
  head: () => ({
    meta: [
      { title: "Your documents — Patel Tax & Bookkeeping" },
      { name: "description", content: "Upload your documents privately before your appointment." },
      { property: "og:title", content: "Your documents — Patel Tax & Bookkeeping" },
      { property: "og:description", content: "Private document upload for your appointment." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ManagePage,
});

function ManagePage() {
  const { token } = Route.useParams();
  const fetchAppt = useServerFn(getAppointmentByToken);
  const q = useQuery({ queryKey: ["appt", token], queryFn: () => fetchAppt({ data: { token } }) });

  if (q.isError || (q.data && !q.data.appointment)) {
    return (
      <BookingShell>
        <div className="mx-auto max-w-md text-center">
          <h1 className="text-4xl text-deep-ink">This link isn't working</h1>
          <p className="mt-3 text-deep-ink/70">Use the link in your confirmation email, or call the office.</p>
          <Button asChild size="lg" className="mt-6"><Link to="/">Back to home</Link></Button>
        </div>
      </BookingShell>
    );
  }
  if (!q.data?.appointment) return <BookingShell><div className="mx-auto h-96 max-w-2xl animate-pulse rounded-2xl bg-sheet/60" /></BookingShell>;

  const a = q.data.appointment as { start_at: string; ready_score: number; services: { name: string } | null };
  return (
    <BookingShell>
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center gap-5">
          <ReadyRing value={a.ready_score} size={88} />
          <div className="min-w-0">
            <h1 className="text-4xl leading-tight text-deep-ink">Your documents</h1>
            <p className="text-sm text-deep-ink/70">{a.services?.name} · {fmtDateLong(a.start_at)}, {fmtTime(a.start_at)}</p>
          </div>
        </div>
        <p className="mt-6 flex items-start gap-2 rounded-2xl bg-sage/70 p-4 text-sm text-deep-ink/80">
          <Lock className="mt-0.5 size-4 shrink-0 text-ink" /> Files go to private storage only Priya can open. Photos from your phone are fine. Please don't send your Social Security card.
        </p>
        <ul className="mt-6 space-y-3">
          {q.data.checklist.map((i) => <Item key={i.id} token={token} item={i} onDone={() => q.refetch()} />)}
        </ul>
      </div>
    </BookingShell>
  );
}

function Item({ token, item, onDone }: { token: string; item: { id: string; document_name: string; description: string | null; status: string }; onDone: () => void }) {
  const getUrl = useServerFn(createUploadUrl);
  const confirm = useServerFn(confirmUpload);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(false);
  const done = item.status === "uploaded";

  const onFile = async (f?: File) => {
    if (!f) return;
    setBusy(true); setErr(false);
    try {
      const { path, token: t } = await getUrl({ data: { token, itemId: item.id, fileName: f.name } });
      const up = await supabase.storage.from("client-documents").uploadToSignedUrl(path, t, f);
      if (up.error) throw up.error;
      await confirm({ data: { token, itemId: item.id, path } });
      onDone();
    } catch { setErr(true); }
    setBusy(false);
  };

  return (
    <li className="flex items-center gap-3 rounded-2xl border border-border bg-sheet p-4 shadow-sheet">
      <span className={`grid size-8 shrink-0 place-items-center rounded-full border ${done ? "border-success bg-success text-paper" : "border-border"}`}>
        {done && <Check className="size-4" strokeWidth={3} />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-deep-ink">{item.document_name}</p>
        <p className="truncate text-xs text-muted-foreground">{err ? "Upload didn't work. Please try again." : done ? "Received" : item.description ?? "Needed"}</p>
      </div>
      <label className={`inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-sm font-medium ${done ? "border-border text-muted-foreground" : "border-ink text-ink hover:bg-ink hover:text-paper"}`}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
        {done ? "Replace" : "Upload"}
        <input type="file" className="sr-only" accept="image/*,application/pdf" disabled={busy} onChange={(e) => onFile(e.target.files?.[0])} />
      </label>
    </li>
  );
}
