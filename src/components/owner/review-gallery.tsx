import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Download, Maximize, Printer, RotateCw, ZoomIn, ZoomOut } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getDocumentUrl } from "@/lib/portal.functions";
import { AiTag, DocReview } from "./closeout";
import type { Item } from "./lib";
import { cn } from "@/lib/utils";

type Loaded = { url: string; blob: Blob; pdf: boolean; ext: string; pages: string[]; sample?: boolean } | { error: true };

/** Demo data has checklist items marked "uploaded" without a stored file. Show a clearly labelled sample instead of an empty frame. */
const SAMPLES: [RegExp, string][] = [
  [/photo id/i, "photo-id"], [/last year|prior year/i, "last-year"], [/w-2/i, "w-2"], [/1099-nec|1099-k/i, "1099-nec"],
  [/income & expense|income and expense/i, "income-expense"], [/home office/i, "home-office"], [/1099-int/i, "1099-int"],
  [/1099-b/i, "1099-b"], [/1098-e/i, "1098-e"], [/1098/i, "1098"], [/childcare|dependent care/i, "childcare"],
  [/rental/i, "rental"], [/property tax/i, "property-tax"], [/irs letter|notice/i, "irs-letter"],
];
const sampleFor = (name: string) => `/demo-docs/${SAMPLES.find(([re]) => re.test(name))?.[1] ?? "generic"}.jpg`;

/** Renders every page of a PDF into PNG object URLs (lazy-loaded pdf.js, browser only). */
async function pdfPages(blob: Blob): Promise<string[]> {
  const pdfjs = await import("pdfjs-dist");
  const worker = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = worker;
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await blob.arrayBuffer()) }).promise;
  const out: string[] = [];
  for (let n = 1; n <= Math.min(doc.numPages, 30); n++) {
    const page = await doc.getPage(n);
    const vp = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    canvas.width = vp.width; canvas.height = vp.height;
    await page.render({ canvasContext: canvas.getContext("2d")!, viewport: vp }).promise;
    const png = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/png"));
    if (png) out.push(URL.createObjectURL(png));
  }
  return out;
}

const safeName = (s: string) => s.replace(/[^\w\- ]+/g, "").trim().slice(0, 60) || "document";

export function ReviewGallery({ open, onOpenChange, title, items, onAcceptAll, accepting }: {
  open: boolean; onOpenChange: (o: boolean) => void; title: string; items: Item[];
  onAcceptAll: () => void; accepting: boolean;
}) {
  const getUrl = useServerFn(getDocumentUrl);
  const files = items.filter((i) => i.status === "uploaded").sort((x, y) => x.sort_order - y.sort_order);
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState<Record<string, Loaded>>({});
  const [zoom, setZoom] = useState<number | "fit">("fit");
  const [rot, setRot] = useState(0);
  const [page, setPage] = useState(0);
  const cur = files[Math.min(index, Math.max(0, files.length - 1))];
  const curLoaded = cur ? loaded[`${cur.id}:${cur.file_path}`] : undefined;
  const looksRight = files.filter((i) => i.review_status === "pending" && i.ai_check === "ok");

  // Fetch each private file once per open, through a one-minute signed URL; keep it in memory only.
  const fileKey = files.map((f) => `${f.id}:${f.file_path}`).join("|");
  useEffect(() => {
    if (!open) return;
    let live = true;
    for (const f of files) {
      const k = `${f.id}:${f.file_path}`;
      if (loaded[k]) continue;
      if (!f.file_path) {
        (async () => {
          try {
            const blob = await (await fetch(sampleFor(f.document_name))).blob();
            if (live) setLoaded((m) => ({ ...m, [k]: { url: URL.createObjectURL(blob), blob, pdf: false, ext: "jpg", pages: [], sample: true } }));
          } catch { if (live) setLoaded((m) => ({ ...m, [k]: { error: true } })); }
        })();
        continue;
      }
      (async () => {
        try {
          const r = await getUrl({ data: { itemId: f.id } });
          if (!r.url) throw new Error();
          const blob = await (await fetch(r.url)).blob();
          const ext = (f.file_path!.split(".").pop() ?? "").toLowerCase();
          const pdf = ext === "pdf" || blob.type === "application/pdf";
          const pages = pdf ? await pdfPages(blob) : [];
          if (live) setLoaded((m) => ({ ...m, [k]: { url: URL.createObjectURL(blob), blob, pdf, ext, pages } }));
        } catch (e) { console.error("gallery load failed", f.document_name, e); if (live) setLoaded((m) => ({ ...m, [k]: { error: true } })); }
      })();
    }
    return () => { live = false; };
  }, [open, fileKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) { setLoaded({}); setIndex(0); return; }
    // Start on the first document that actually needs Claire.
    const first = files.findIndex((f) => f.review_status === "pending" && f.ai_check !== "warning" && f.ai_check !== "ok");
    setIndex(first >= 0 ? first : 0);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setZoom("fit"); setRot(0); setPage(0); }, [cur?.id]);

  const go = useCallback((d: number) => setIndex((i) => Math.min(Math.max(0, i + d), files.length - 1)), [files.length]);
  const zoomBy = useCallback((f: number) => setZoom((z) => Math.min(4, Math.max(0.25, (z === "fit" ? 1 : z) * f))), []);
  const next = () => {
    const after = files.findIndex((f, i) => i > index && f.review_status === "pending" && f.ai_check !== "warning");
    if (after >= 0) setIndex(after); else if (index < files.length - 1) setIndex(index + 1);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
      else if (e.key === "+" || e.key === "=") { e.preventDefault(); zoomBy(1.25); }
      else if (e.key === "-" || e.key === "_") { e.preventDefault(); zoomBy(0.8); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, go, zoomBy]);

  const downloadAll = async () => {
    const ready = files.map((f) => ({ f, l: loaded[`${f.id}:${f.file_path}`] })).filter((x): x is { f: Item; l: Extract<Loaded, { url: string }> } => !!x.l && !("error" in x.l));
    if (!ready.length) { toast.error("Files are still loading. Try again in a moment."); return; }
    const { zipSync } = await import("fflate");
    const entries: Record<string, Uint8Array> = {};
    for (const { f, l } of ready) {
      let name = `${safeName(f.document_name)}.${l.ext || "bin"}`;
      let n = 2; while (entries[name]) name = `${safeName(f.document_name)} (${n++}).${l.ext}`;
      entries[name] = new Uint8Array(await l.blob.arrayBuffer());
    }
    const zip = zipSync(entries, { level: 0 });
    const url = URL.createObjectURL(new Blob([zip.slice().buffer], { type: "application/zip" }));
    const a = document.createElement("a"); a.href = url; a.download = `${safeName(title)} documents.zip`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    if (ready.length < files.length) toast.message(`${files.length - ready.length} file couldn't be added.`);
  };

  const print = () => {
    if (!curLoaded || "error" in curLoaded) return;
    const frame = document.createElement("iframe");
    frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
    document.body.appendChild(frame);
    const imgs = curLoaded.pdf ? curLoaded.pages : [curLoaded.url];
    frame.srcdoc = `<html><body style="margin:0">${imgs.map((s) => `<img src="${s}" style="width:100%;page-break-after:always">`).join("")}</body></html>`;
    frame.onload = () => { setTimeout(() => { frame.contentWindow?.print(); setTimeout(() => frame.remove(), 60_000); }, 200); };
  };

  const view = curLoaded && !("error" in curLoaded) ? (curLoaded.pdf ? curLoaded.pages[page] : curLoaded.url) : undefined;
  // Rotation is baked into the pixels so zoom and scrolling keep working naturally.
  const [shown, setShown] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (!view || rot === 0) { setShown(view); return; }
    let live = true; let made: string | null = null;
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas"); const side = rot % 180 !== 0;
      c.width = side ? img.naturalHeight : img.naturalWidth; c.height = side ? img.naturalWidth : img.naturalHeight;
      const ctx = c.getContext("2d")!; ctx.translate(c.width / 2, c.height / 2); ctx.rotate((rot * Math.PI) / 180); ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
      c.toBlob((b) => { if (b && live) { made = URL.createObjectURL(b); setShown(made); } });
    };
    img.src = view;
    return () => { live = false; if (made) URL.revokeObjectURL(made); };
  }, [view, rot]);
  const pageCount = curLoaded && !("error" in curLoaded) && curLoaded.pdf ? curLoaded.pages.length : 0;
  const thumb = (f: Item) => { const l = loaded[`${f.id}:${f.file_path}`]; return l && !("error" in l) ? (l.pdf ? l.pages[0] : l.url) : undefined; };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="data-[state=open]:animate-[overlay-in_200ms_cubic-bezier(0.16,1,0.3,1)] left-0 top-0 flex h-dvh max-h-none w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-0 p-0 sm:rounded-none">
        <header className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3 pr-16 sm:px-6 sm:pr-16">
          <div className="min-w-0 flex-1">
            <DialogTitle className="truncate text-sm font-medium text-deep-ink">Review documents, {title}</DialogTitle>
            <DialogDescription className="hidden text-xs text-muted-foreground sm:block">{files.length} file{files.length === 1 ? "" : "s"}. Private, loaded through links that expire after a minute.</DialogDescription>
          </div>
          {looksRight.length >= 2 && <Button size="sm" variant="secondary" disabled={accepting} onClick={onAcceptAll}>{accepting ? "Accepting…" : "Accept all that look right"}</Button>}
          <Button size="sm" variant="secondary" aria-label="Download all" onClick={downloadAll}><Download /><span className="hidden sm:inline">Download all</span></Button>
          <Button size="sm" variant="secondary" aria-label="Print" disabled={!view} onClick={print}><Printer /><span className="hidden sm:inline">Print</span></Button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col md:grid md:grid-cols-[200px_minmax(0,1fr)_320px]">
          <ul aria-label="Files" className="flex shrink-0 gap-2 overflow-x-auto border-b border-border p-3 md:flex-col md:overflow-y-auto md:border-b-0 md:border-r">
            {files.map((f, i) => (
              <li key={f.id} className="shrink-0">
                <button type="button" onClick={() => setIndex(i)} aria-current={i === index}
                  className={cn("flex w-24 flex-col gap-1 rounded-xl border p-2 text-left transition-colors duration-150 hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:w-full", i === index ? "border-deep-ink bg-surface-2" : "border-border")}>
                  <span className="grid h-14 place-items-center overflow-hidden rounded-lg bg-fill-subtle md:h-28">
                    {thumb(f) ? <img src={thumb(f)} alt="" className="h-full w-full object-cover object-top" /> : loaded[`${f.id}:${f.file_path}`] ? <span className="text-[11px] text-muted-foreground">No preview</span> : <Skeleton className="h-full w-full" />}
                  </span>
                  <span className="truncate text-xs text-deep-ink md:line-clamp-2 md:whitespace-normal">{f.document_name}</span>
                  <AiTag i={f} />
                </button>
              </li>
            ))}
          </ul>

          <section className="relative flex min-h-0 flex-1 flex-col bg-surface-2">
            <div className="flex items-center justify-center gap-1 border-b border-border bg-sheet px-2 py-1.5">
              <Button size="icon" variant="ghost" aria-label="Previous file" disabled={index === 0} onClick={() => go(-1)}><ChevronLeft /></Button>
              <span className="tabular w-12 text-center text-xs text-muted-foreground">{files.length ? index + 1 : 0} / {files.length}</span>
              <Button size="icon" variant="ghost" aria-label="Next file" disabled={index >= files.length - 1} onClick={() => go(1)}><ChevronRight /></Button>
              <span className="mx-1 h-5 w-px bg-border" />
              <Button size="icon" variant="ghost" aria-label="Zoom out" onClick={() => zoomBy(0.8)}><ZoomOut /></Button>
              <span className="tabular w-10 text-center text-xs text-muted-foreground">{zoom === "fit" ? "Fit" : `${Math.round(zoom * 100)}%`}</span>
              <Button size="icon" variant="ghost" aria-label="Zoom in" onClick={() => zoomBy(1.25)}><ZoomIn /></Button>
              <Button size="icon" variant="ghost" aria-label="Fit to screen" onClick={() => setZoom("fit")}><Maximize /></Button>
              <Button size="icon" variant="ghost" aria-label="Rotate" onClick={() => setRot((r) => (r + 90) % 360)}><RotateCw /></Button>
            </div>
            <div className="min-h-0 flex-1 overflow-auto p-4">
              {!cur ? <p className="grid h-full place-items-center text-sm text-muted-foreground">No files uploaded yet.</p>
                : !curLoaded ? <Skeleton className="mx-auto h-full min-h-[40vh] w-full max-w-xl rounded-xl" />
                : "error" in curLoaded || !view ? <p className="grid h-full place-items-center text-sm text-warning">There's no file to preview for this document.</p>
                : <div className={cn("flex min-h-full", zoom === "fit" ? "items-center justify-center" : "items-start justify-start")}>
                    <img src={shown ?? view} alt={cur.document_name}
                      className={cn("rounded-lg border border-border bg-sheet shadow-[0_1px_2px_rgba(16,16,16,0.06)]", zoom === "fit" && "max-h-[calc(100dvh-260px)] max-w-full object-contain md:max-h-[calc(100dvh-140px)]")}
                      style={zoom === "fit" ? undefined : { width: `${zoom * 100}%`, maxWidth: "none" }} />
                  </div>}
            </div>
            {pageCount > 1 && (
              <div className="flex items-center justify-center gap-1 border-t border-border bg-sheet py-1.5">
                <Button size="sm" variant="ghost" disabled={page === 0} onClick={() => setPage((p) => p - 1)}><ChevronLeft />Page</Button>
                <span className="tabular text-xs text-muted-foreground">{page + 1} of {pageCount}</span>
                <Button size="sm" variant="ghost" disabled={page >= pageCount - 1} onClick={() => setPage((p) => p + 1)}>Page<ChevronRight /></Button>
              </div>
            )}
          </section>

          <aside className="sticky bottom-0 shrink-0 border-t border-border bg-sheet p-4 md:static md:overflow-y-auto md:border-l md:border-t-0 md:p-5">
            {cur && <>
              <div className="flex items-start justify-between gap-2"><p className="text-sm font-medium text-deep-ink">{cur.document_name}</p><AiTag i={cur} /></div>
              {curLoaded && !("error" in curLoaded) && curLoaded.sample && <p className="mt-2 rounded-lg bg-fill-subtle px-2.5 py-1.5 text-[11px] text-muted-foreground">Demo data: a sample document is shown in place of the client's file.</p>}
              {cur.ai_note && <p className={cn("mt-2 text-xs", cur.ai_check === "warning" || cur.ai_check === "kept" ? "text-warning" : "text-muted-foreground")}>{cur.ai_note}{cur.ai_check === "kept" && " The client chose to keep it."}</p>}
              <div className="mt-3"><DocReview key={cur.id} i={cur} inline onDone={next} /></div>
              {cur.review_status === "accepted" && <p className="mt-2 text-xs text-muted-foreground">Accepted. Use the arrows to keep going.</p>}
            </>}
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
}
