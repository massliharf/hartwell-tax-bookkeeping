import { createFileRoute, redirect } from "@tanstack/react-router";

// Old link format — keep working by sending people to the portal.
export const Route = createFileRoute("/manage/$token")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/a/$token", params: { token: params.token }, replace: true });
  },
});
