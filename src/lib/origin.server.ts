import { getRequest } from "@tanstack/react-start/server";

// Canonical public URL for links inside emails — never localhost, even in preview.
const CANONICAL = process.env["SITE_URL"] ?? "https://patel-ready-book.lovable.app";

export function requestOrigin() {
  try {
    const origin = new URL(getRequest().url).origin;
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return CANONICAL;
    return origin;
  } catch {
    return CANONICAL;
  }
}
