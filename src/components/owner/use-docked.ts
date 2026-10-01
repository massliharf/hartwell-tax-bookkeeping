import { useEffect, useState } from "react";

/** True on screens wide enough to keep the panel docked next to the page (Magnific-style right panel). */
export function useDocked() {
  const [docked, setDocked] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(min-width: 1180px)");
    const on = () => setDocked(m.matches);
    on(); m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return docked;
}
