import { Check } from "lucide-react";
import { Segmented } from "@/components/ui/segmented";
import { CHIPS, chipsFor, questionsFor, type Answers, type ChipKey } from "@/lib/intake";
import { cn } from "@/lib/utils";

/**
 * The questions that build a client's document list: one or two quick ones, then "which of these applied?"
 * as tap-to-select chips. Used when booking and on the client's page (bookings made by phone).
 */
export function IntakeQuestions({ slug, answers, onChange }: { slug?: string | null | undefined; answers: Answers; onChange: (a: Answers) => void }) {
  const qs = questionsFor(slug);
  const chips = chipsFor(slug);
  const toggle = (k: ChipKey) => onChange({ ...answers, none_apply: false, [k]: !answers[k] });
  const none = () => onChange({ ...answers, none_apply: !answers.none_apply, ...Object.fromEntries(chips.map((k) => [k, false])) });
  return (
    <div className="space-y-3">
      {qs.map((q) => (
        <div key={q.key} className="flex flex-col gap-3 rounded-xl bg-surface-2 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-deep-ink">{q.label}</p>
            {q.hint && <p className="text-xs text-muted-foreground">{q.hint}</p>}
          </div>
          {q.type === "count" ? (
            <Segmented className="shrink-0" label={q.label} value={String((answers[q.key] as number) ?? 0)} onChange={(v) => onChange({ ...answers, [q.key]: Number(v) })}
              options={[0, 1, 2, 3].map((n) => ({ value: String(n), label: n === 3 ? "3+" : String(n) }))} />
          ) : (
            <Segmented className="shrink-0" label={q.label} value={answers[q.key] === true ? "yes" : answers[q.key] === false ? "no" : ("" as "yes" | "no")}
              onChange={(v) => onChange({ ...answers, [q.key]: v === "yes" })} options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]} />
          )}
        </div>
      ))}
      {chips.length > 0 && (
        <fieldset className="rounded-xl bg-surface-2 p-4">
          <legend className="sr-only">Which of these applied this year?</legend>
          <p className="text-sm font-medium text-deep-ink" aria-hidden="true">Which of these applied this year?</p>
          <p className="text-xs text-muted-foreground">Pick all that fit. Each one adds the matching form to your list.</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {chips.map((k) => {
              const on = answers[k] === true;
              return (
                <button key={k} type="button" aria-pressed={on} onClick={() => toggle(k)}
                  className={cn("inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition-colors duration-150 sm:min-h-9",
                    on ? "border-deep-ink bg-deep-ink text-white" : "border-line-2 bg-sheet text-body hover:border-line-3")}>
                  {on && <Check className="size-3.5" strokeWidth={3} />}{CHIPS[k]}
                </button>
              );
            })}
            <button type="button" aria-pressed={!!answers.none_apply} onClick={none}
              className={cn("inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition-colors duration-150 sm:min-h-9",
                answers.none_apply ? "border-deep-ink bg-deep-ink text-white" : "border-dashed border-line-3 bg-transparent text-muted-foreground hover:text-deep-ink")}>
              {answers.none_apply && <Check className="size-3.5" strokeWidth={3} />}None of these
            </button>
          </div>
        </fieldset>
      )}
    </div>
  );
}
