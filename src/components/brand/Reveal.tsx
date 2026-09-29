import type { ReactNode } from "react";

export function Reveal({ children, className }: { children: ReactNode; delay?: number; className?: string | undefined }) {
  return <div className={className}>{children}</div>;
}
