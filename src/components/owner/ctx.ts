import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getOwnerContext } from "@/lib/owner.functions";

/** Owner flag + the practice clock (getNow on the server, incl. demo offset). */
export function useOwnerCtx() {
  const fn = useServerFn(getOwnerContext);
  return useQuery({
    queryKey: ["owner", "ctx"],
    queryFn: async () => {
      // Skip the server call while signed out (e.g. mid sign-out) so it never fails with 401.
      const { data } = await supabase.auth.getSession();
      if (!data.session) return { isOwner: false, now: new Date().toISOString() };
      return fn();
    },
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}
