import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { BookingShell, ResultPanel } from "@/components/booking/BookingShell";
import { Compass, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

function NotFoundComponent() {
  return (
    <BookingShell>
      <ResultPanel icon={<Compass />} title="This page isn't here." actions={<><Button asChild size="lg"><Link to="/book">Book an appointment</Link></Button><Button asChild size="lg" variant="secondary"><Link to="/">Back to home</Link></Button></>}>
        The link may be old or mistyped. Booking takes about two minutes.
      </ResultPanel>
    </BookingShell>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <BookingShell>
      <ResultPanel icon={<RotateCcw />} tone="warning" title="This page didn't load." actions={<><Button size="lg" onClick={() => { router.invalidate(); reset(); }}>Try again</Button><Button asChild size="lg" variant="secondary"><a href="/">Back to home</a></Button></>}>
        It's on our side, not yours. Try again, or call the office at (973) 555-0142.
      </ResultPanel>
    </BookingShell>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Hartwell Tax & Bookkeeping — Montclair, NJ" },
      { name: "description", content: "Tax preparation and bookkeeping by Claire Hartwell, EA, in Montclair, New Jersey." },
      { name: "author", content: "Hartwell Tax & Bookkeeping" },
      { property: "og:title", content: "Hartwell Tax & Bookkeeping — Montclair, NJ" },
      { property: "og:description", content: "Tax preparation and bookkeeping by Claire Hartwell, EA, in Montclair, New Jersey." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,600;12..96,700&family=Geist:wght@400;500;600;700&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "alternate icon", href: "/favicon.ico" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => data.subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
      <Toaster position="top-center" />
    </QueryClientProvider>
  );
}
