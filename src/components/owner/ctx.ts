import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getOwnerContext } from "@/lib/owner.functions";

/** Owner flag + the practice clock (getNow on the server, incl. demo offset). */
export function useOwnerCtx() {
  const fn = useServerFn(getOwnerContext);
  return useQuery({ queryKey: ["owner", "ctx"], queryFn: () => fn(), staleTime: 60_000, refetchInterval: 60_000 });
}
