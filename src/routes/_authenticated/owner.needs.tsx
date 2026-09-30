import { createFileRoute, redirect } from "@tanstack/react-router";

// "Needs you" lives at the top of Today.
export const Route = createFileRoute("/_authenticated/owner/needs")({ beforeLoad: () => { throw redirect({ to: "/owner" }); } });
