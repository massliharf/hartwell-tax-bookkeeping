import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpRight, Clock3, MapPin, ShieldCheck, Star } from "lucide-react";
import { DocumentStack } from "@/components/brand/DocumentStack";
import { Button } from "@/components/ui/button";
import { ServiceBookingCard } from "@/components/site/ServiceBookingCard";
import { SERVICES } from "@/lib/services";
import { previewChecklist } from "@/lib/intake";
import { SERVICE_PHOTOS } from "@/components/site/service-photos";
import { SiteHeader, SiteFooter } from "@/components/site/SiteChrome";
import papers from "@/assets/service-detail-documents.jpg";
import office from "@/assets/service-detail-office.jpg";
import priya from "@/assets/priya-portrait.jpg";

const descriptions: Record<string, string[]> = {
  individual: ["Review of W-2 income, deductions and credits", "Federal and New Jersey return preparation", "A clear walkthrough before filing"],
  "self-employed": ["Schedule C income and expenses", "Deduction and estimated-payment review", "Federal and New Jersey return preparation"],
  rental: ["Rental income and expense review", "Property tax and depreciation discussion", "Federal and New Jersey return preparation"],
  extension: ["Review your IRS letter or extension needs", "Understand what comes next and when", "A clear plan for your filing"],
  bookkeeping: ["Review your current books", "Find gaps and simplify your process", "A practical next-steps plan"],
};
const sampleReviews: Record<string, string> = {
  individual: "I knew exactly what to bring, and Priya explained every step without rushing me.",
  "self-employed": "My freelance work finally made sense on paper. The checklist saved so much back-and-forth.",
  rental: "The rental checklist helped me gather everything before we met.",
  extension: "I arrived worried about a letter and left knowing what to do next.",
  bookkeeping: "I walked out with a simple plan for getting my books in order.",
};
export const Route = createFileRoute("/services/$slug")({
  loader: ({ params }) => { const service = SERVICES.find(s => s.id === params.slug); if (!service) throw notFound(); return service; },
  head: ({ loaderData }) => ({ meta: [ { title: `${loaderData?.name ?? "Service"} — Patel Tax & Bookkeeping` }, { name: "description", content: `${loaderData?.blurb ?? "Tax services"} Book with Priya Patel, EA in Edison.` }, { property: "og:title", content: `${loaderData?.name ?? "Service"} — Patel Tax & Bookkeeping` }, { property: "og:description", content: loaderData?.blurb ?? "Tax services in Edison, NJ." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" } ] }),
  component: ServiceDetail,
});
function SectionTitle({ children }: { children: React.ReactNode }) { return <h2 className="font-serif text-3xl text-deep-ink sm:text-4xl">{children}</h2>; }
function ServiceDetail() {
  const s = Route.useLoaderData();
  const docs = previewChecklist(s.id, { w2_count: s.id === "individual" ? 1 : 0 });
  const images = [{src:SERVICE_PHOTOS[s.id],alt:`${s.name} preparation at a desk`},{src:papers,alt:"Organized paperwork in a bright office"},{src:office,alt:"A welcoming consultation space"}];
  return <><SiteHeader/><main className="mx-auto max-w-6xl px-5 pb-28 pt-8 lg:pb-16"><Link to="/" hash="services" className="inline-flex items-center gap-2 text-sm text-ink hover:underline"><ArrowLeft className="size-4"/> All services</Link>
    <div className="mt-6 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)] md:grid-rows-2 md:overflow-visible md:pb-0">
      {images.map((im,i)=><img key={im.src} src={im.src} alt={im.alt} loading={i===0?"eager":"lazy"} width={i===0?900:928} height={i===0?650:720} className={`aspect-[4/3] w-[88%] shrink-0 snap-center rounded-[14px] object-cover sm:w-[60%] md:w-full ${i===0?"md:row-span-2 md:aspect-auto md:h-full md:min-h-[370px]":"md:aspect-[2.1]"}`}/>)}
    </div><p className="mt-2 text-xs text-muted-foreground md:hidden">Swipe to see more photos</p>
    <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(390px,0.78fr)] lg:gap-14">
      <div className="min-w-0 space-y-14"><header><p className="text-xs font-semibold uppercase text-ink">With Priya Patel, EA</p><h1 className="mt-2 font-serif text-5xl leading-tight text-deep-ink sm:text-6xl">{s.name}</h1><p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">{s.blurb} Calm, personal help that starts with a clear plan and ends with you feeling ready.</p><div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-deep-ink"><span className="inline-flex items-center gap-2"><Clock3 className="size-4 text-ink"/>{s.minutes} minutes</span><span className="tabular">{s.from?"From ":""}${s.price}</span><span className="inline-flex items-center gap-1"><Star className="size-4 fill-current text-warning"/>4.9 <span className="text-xs text-muted-foreground">illustrative rating</span></span></div></header>
        <section><SectionTitle>What’s included</SectionTitle><ul className="mt-5 divide-y divide-border">{descriptions[s.id]?.map(item=><li key={item} className="flex items-center gap-3 py-3 text-sm text-deep-ink"><ShieldCheck className="size-5 shrink-0 text-ink"/>{item}</li>)}</ul></section>
        <section><SectionTitle>What you’ll need</SectionTitle><p className="mt-2 text-sm text-muted-foreground">A starting point. Your personal checklist is made after you book, and you can upload everything later.</p><div className="mt-5"><DocumentStack docs={docs.map(d=>({...d,received:false}))}/></div></section>
        <section><SectionTitle>How your appointment works</SectionTitle><ol className="mt-5 border-l border-border pl-6">{[["01","Choose your time","Your appointment is confirmed instantly."],["02","Share your documents","We’ll give you a personal list; send files when you’re ready."],["03","Meet with Priya","Come to Oak Tree Road or join by video."]].map(([n,title,text])=><li key={n} className="relative pb-7 last:pb-0"><span className="absolute -left-[33px] top-0 grid size-5 place-items-center rounded-full bg-primary text-[8px] font-semibold text-primary-foreground">{n}</span><h3 className="font-semibold text-deep-ink">{title}</h3><p className="mt-1 text-sm text-muted-foreground">{text}</p></li>)}</ol></section>
        <section className="grid items-center gap-6 border-y border-border py-8 sm:grid-cols-[130px_1fr]"><img src={priya} alt="Illustrative portrait, not Priya’s actual photo" loading="lazy" width={850} height={1050} className="aspect-square w-32 rounded-[14px] object-cover object-top"/><div><p className="text-xs font-semibold uppercase text-ink">Your tax advisor</p><h2 className="mt-1 font-serif text-3xl text-deep-ink">Priya Patel</h2><p className="text-sm font-semibold text-muted-foreground">IRS Enrolled Agent</p><p className="mt-2 text-sm leading-relaxed text-muted-foreground">For 12 years, Priya has helped Edison families and small businesses find a simpler way through tax season.</p><p className="mt-2 text-xs text-muted-foreground">Portrait is illustrative; replace before launch.</p></div></section>
        <section><SectionTitle>Kind words</SectionTitle><figure className="mt-5 border-l-2 border-primary pl-5"><div className="flex gap-0.5 text-warning" aria-label="Five stars">{Array.from({length:5},(_,i)=><Star key={i} className="size-3 fill-current"/>)}</div><blockquote className="mt-3 font-serif text-2xl leading-snug text-deep-ink">“{sampleReviews[s.id]}”</blockquote><figcaption className="mt-3 text-xs text-muted-foreground">Illustrative review — replace with a verified client review before publishing.</figcaption></figure></section>
        <section><SectionTitle>Where we’ll meet</SectionTitle><p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="size-4 text-ink"/>Oak Tree Road, Edison, NJ · or by video</p><a href="https://www.google.com/maps/search/?api=1&query=Oak+Tree+Road%2C+Edison%2C+NJ" target="_blank" rel="noreferrer" className="mt-5 block overflow-hidden rounded-[14px] border border-border bg-sheet focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"><img src="/oak-tree-area.svg" alt="Illustrative map of the Oak Tree Road area; exact office location shared after booking" loading="lazy" width={800} height={320} className="aspect-[2.5] w-full object-cover"/><span className="flex items-center justify-between px-4 py-3 text-sm font-semibold text-ink">View Oak Tree Road on Google Maps <ArrowUpRight className="size-4"/></span></a><p className="mt-2 text-xs text-muted-foreground">Approximate area only. Your confirmation includes visit details.</p></section>
        <section><SectionTitle>Plans change. That’s okay.</SectionTitle><p className="mt-3 text-sm leading-relaxed text-muted-foreground">Use the link in your confirmation to reschedule or cancel. Please let us know as soon as you can, so someone else can use the time. No payment is due when you book.</p></section>
      </div><ServiceBookingCard service={s}/>
    </div>
  </main><SiteFooter/></>;
}
