import { getRequest } from "@tanstack/react-start/server";

export function requestOrigin() {
  try { return new URL(getRequest().url).origin; } catch { return process.env["SITE_URL"] ?? ""; }
}
