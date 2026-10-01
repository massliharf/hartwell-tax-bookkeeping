import { cn } from "@/lib/utils";
import logo from "@/assets/hartwell-logo.png";
import logoLight from "@/assets/hartwell-logo-light.png";
import mark from "@/assets/hartwell-mark.png";
import markLight from "@/assets/hartwell-mark-light.png";

/** The same Hartwell artwork is used for the full logo and its compact monogram. */
export function LogoMark({ size = 32, className, tone = "ink" }: { size?: number; className?: string; tone?: "ink" | "light" | "brand" }) {
  return <img src={tone === "light" ? markLight : mark} width={size} height={size} alt="" aria-hidden="true" className={cn("shrink-0 object-contain", className)} />;
}

export function Logo({ size = 32, variant = "stacked", tone = "dark", className, sub: _sub }: {
  size?: number; variant?: "stacked" | "inline" | "name"; tone?: "dark" | "light"; className?: string; sub?: string;
}) {
  const height = size === 32 ? 44 : Math.round(size * 1.25);
  return <img
    src={tone === "light" ? logoLight : logo}
    width={Math.round(height * 1076 / 306)}
    height={height}
    alt="Hartwell Tax & Bookkeeping"
    className={cn("block h-auto max-h-11 max-w-full object-contain object-left", className)}
    data-variant={variant}
  />;
}