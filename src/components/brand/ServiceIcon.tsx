import { serviceStyle } from "@/lib/service-style";
import { cn } from "@/lib/utils";

export function ServiceIcon({ service, size = 40, className }: { service?: string | null | undefined; size?: 28 | 32 | 40; className?: string }) {
  const st = serviceStyle(service);
  const Icon = st.icon;
  return (
    <span className={cn("grid shrink-0 place-items-center rounded-lg", className)} style={{ width: size, height: size, backgroundColor: `rgba(${st.rgb},0.1)` }}>
      <Icon strokeWidth={1.75} style={{ color: `rgb(${st.rgb})`, width: size * 0.45, height: size * 0.45 }} />
    </span>
  );
}
