import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { ClientProfile } from "@/components/owner/client-content";

export const Route = createFileRoute("/_authenticated/owner/clients/$id")({ head: () => ({ meta: [{ title: "Client — Hartwell Tax & Bookkeeping" }, { name: "robots", content: "noindex" }] }), component: ClientPage });

function ClientPage() {
  const { id } = Route.useParams();
  return (
    <>
      <Link to="/owner/clients" className="mb-4 inline-flex h-8 items-center gap-1 rounded-lg pr-2 text-xs text-muted-foreground transition-colors duration-150 hover:text-deep-ink"><ChevronLeft className="size-4" />Clients</Link>
      <ClientProfile id={id} />
    </>
  );
}
