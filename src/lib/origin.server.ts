import { getRequest } from "@tanstack/react-start/server";

// Canonical public URL for links in emails and demo links. Clients must never get a localhost or Lovable
// preview link (those need a Lovable login), so anything that isn't the public site or a custom domain
// falls back to the published address.
const CANONICAL = process.env["SITE_URL"] ?? "https://hartwell-tax-bookkeeping.lovable.app";

export function requestOrigin() {
  try {
    const url = new URL(getRequest().url);
    const host = url.hostname;
    const isLocal = /^(localhost|127\.0\.0\.1)$/.test(host);
    const isPreview = host.endsWith("lovableproject.com") || host.endsWith("lovableproject-dev.com") || host.startsWith("id-preview--") || host.includes("--") && host.endsWith("lovable.app");
    const isOldName = host === "patel-ready-book.lovable.app";
    if (isLocal || isPreview || isOldName) return CANONICAL;
    return url.origin;
  } catch {
    return CANONICAL;
  }
}
