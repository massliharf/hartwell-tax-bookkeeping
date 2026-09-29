import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { BriefcaseBusiness, House, Baby, GraduationCap, FileWarning, FileText, Laptop } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReadyRing } from "@/components/brand/ReadyRing";
import { previewChecklist, type Answers } from "@/lib/intake";
import { DocumentStack } from "@/components/brand/DocumentStack";

const CHIPS = [
  { key: "w2_count", label: "W-2 job", icon: BriefcaseBusiness },
  { key: "freelance", label: "Freelance", icon: Laptop },
  { key: "rental", label: "Rental", icon: House },
  { key: "mortgage", label: "Mortgage", icon: House },
  { key: "student_loans", label: "Student loans", icon: GraduationCap },
  { key: "dependents", label: "Kids & childcare", icon: Baby },
  { key: "irs_letter", label: "IRS letter", icon: FileWarning },
] as const;
export function SituationChecklist() {
  const [answers, setAnswers] = useState<Answers>({});
  const navigate = useNavigate();
  const active = (k: typeof CHIPS[number]["key"]) => k === "w2_count" ? !!answers.w2_count : !!answers[k];
  const slug = answers.irs_letter ? "extension" : answers.rental ? "rental" : answers.freelance ? "self-employed" : "individual";
  const docs = previewChecklist(slug, answers);
  return <section className="border-y border-border bg-sheet py-16"><div className="mx-auto max-w-6xl px-5"><p className="text-xs font-semibold uppercase text-ink">Made for your situation</p><div className="mt-2 flex items-end justify-between gap-4"><h2 className="font-serif text-3xl text-deep-ink sm:text-4xl">What’s part of your year?</h2><p className="hidden text-sm text-muted-foreground sm:block">Select anything that applies</p></div>
    <div className="-mx-5 mt-7 flex gap-6 overflow-x-auto px-5 pb-2" aria-label="Your situation">{CHIPS.map(({key,label,icon:Icon}) => <Button key={key} type="button" variant="ghost" aria-pressed={active(key)} onClick={() => setAnswers(a => ({...a, [key]: key === "w2_count" ? (a.w2_count ? 0 : 1) : !a[key]}))} className={`h-auto shrink-0 rounded-none border-b-2 px-1 py-3 text-sm ${active(key) ? "border-ink text-deep-ink" : "border-transparent text-muted-foreground"}`}><Icon className="size-4" />{label}</Button>)}</div>
    <div className="mt-10 grid gap-8 md:grid-cols-[0.8fr_1.2fr] md:items-center"><div><div className="flex items-center gap-5"><ReadyRing value={0} size={96}/><div><p className="font-serif text-3xl text-deep-ink">0 of {docs.length} documents</p><p className="mt-1 text-sm text-muted-foreground">Your list grows with what you select.</p></div></div><Button className="mt-7" onClick={() => navigate({ to: "/book", search: { service: slug, answers: JSON.stringify(answers), step: 1 } })}>Book with this checklist</Button><p className="mt-3 text-xs text-muted-foreground">Upload after booking, whenever you’re ready.</p></div><div className="min-w-0 rounded-[14px] border border-border bg-background p-4 shadow-sheet"><div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink"><FileText className="size-4"/> Your checklist preview</div><div className="max-h-[260px] overflow-y-auto"><DocumentStack docs={docs.map(d => ({...d,received:false}))}/></div></div></div>
  </div></section>;
}
