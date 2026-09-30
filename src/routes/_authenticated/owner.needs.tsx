import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useOwnerCtx } from "@/components/owner/ctx";
import { needsYou } from "@/components/owner/lib";
import { Empty, ErrorNote, LoadingRows, NeedsList, PageHead } from "@/components/owner/ui";

export const Route = createFileRoute("/_authenticated/owner/needs")({ head: () => ({ meta: [{ title: "Needs you — Hartwell Tax & Bookkeeping" }, { name: "description", content: "Owner follow-ups for Hartwell Tax & Bookkeeping." }, { property: "og:title", content: "Needs you — Hartwell Tax & Bookkeeping" }, { property: "og:description", content: "Owner follow-ups for Hartwell Tax & Bookkeeping." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }), component: Needs });
function Needs() {
  const now = useOwnerCtx().data!.now;
  const q = useQuery(needsYou(now));
  return <><PageHead eyebrow="The only list you need" title="Needs you"><p>Everything else is handled automatically.</p></PageHead>{q.isLoading && <LoadingRows />}{q.isError && <ErrorNote onRetry={() => q.refetch()} />}{q.data && !q.data.length && <Empty title="Nothing needs you right now.">Reminders, confirmations and the waitlist are running on their own. Enjoy the quiet.</Empty>}{q.data && <NeedsList items={q.data} />}</>;
}
