import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

function NotFoundComponent() {
  return (
    <main className="grid min-h-screen place-items-center bg-paper px-5">
      <div className="sheet-stack mx-auto max-w-md px-8 py-12 text-center">
        <p className="text-xs font-medium text-muted-foreground">Page not found</p>
        <h1 className="mt-2 font-serif text-2xl leading-9 sm:text-[28px] sm:leading-[42px] text-deep-ink">This page isn't here.</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          The link may be old or mistyped. You can head back home, or book an appointment in about two minutes.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-2">
          <Button asChild><Link to="/">
            Back to home
          </Link></Button>
          <Button asChild variant="secondary"><Link to="/book">
            Book an appointment
          </Link></Button>
        </div>
      </div>
    </main>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center bg-paper px-5">
      <div className="sheet-stack mx-auto max-w-md px-8 py-12 text-center">
        <p className="text-xs font-medium text-muted-foreground">Something went wrong</p>
        <h1 className="mt-2 font-serif text-2xl leading-9 sm:text-[28px] sm:leading-[42px] text-deep-ink">This page didn't load.</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          It's on our side, not yours. Try again, or call the office at (973) 555-0142.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-2">
          <Button onClick={() => { router.invalidate(); reset(); }}>
            Try again
          </Button>
          <Button asChild variant="secondary"><a href="/">
            Back to home
          </a></Button>
        </div>
      </div>
    </main>
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
        href: "https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600&family=Geist:wght@400;500;600;700&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "alternate icon", href: "/favicon.ico" },
      { rel: "apple-touch-icon", href: "/favicon.svg" },
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
