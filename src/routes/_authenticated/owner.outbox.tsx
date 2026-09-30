import { createFileRoute, redirect } from "@tanstack/react-router";

// Messages now live on the Report page.
export const Route = createFileRoute("/_authenticated/owner/outbox")({ beforeLoad: () => { throw redirect({ to: "/owner/insights" }); } });
