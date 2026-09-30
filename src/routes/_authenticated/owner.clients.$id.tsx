import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { ClientContent } from "@/components/owner/client-content";
export const Route = createFileRoute("/_authenticated/owner/clients/$id")({ head: () => ({ meta: [{ title: "Client — Hartwell Tax & Bookkeeping" }, { name: "description", content: "Client appointments and documents." }, { property: "og:title", content: "Client — Hartwell Tax & Bookkeeping" }, { property: "og:description", content: "Client appointments and documents." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }), component: ClientDetail });
function ClientDetail() { const { id } = Route.useParams(); return <><Link to="/owner/clients" className="mb-6 inline-flex items-center gap-1 text-sm text-ink"><ArrowLeft className="size-4" />All clients</Link><ClientContent id={id} /></>; }
