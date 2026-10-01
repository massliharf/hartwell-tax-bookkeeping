import { cn } from "@/lib/utils";

const tones = [
  "bg-avatar-rose text-avatar-rose-ink",
  "bg-avatar-sage text-avatar-sage-ink",
  "bg-avatar-sky text-avatar-sky-ink",
  "bg-avatar-gold text-avatar-gold-ink",
  "bg-avatar-lilac text-avatar-lilac-ink",
  "bg-avatar-teal text-avatar-teal-ink",
] as const;

/** A stable color per client, so the same person looks the same across owner views. */
export function ClientAvatar({ name, id, className }: { name?: string | null; id?: string | null; className?: string }) {
  const key = id || name || "?";
  let hash = 0;
  for (const character of key) hash = (hash * 31 + character.charCodeAt(0)) | 0;
  const words = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  const initials = words.length > 1 ? `${words[0]?.[0] ?? ""}${words[words.length - 1]?.[0] ?? ""}` : words[0]?.[0] ?? "?";
  return <span aria-hidden="true" className={cn("grid size-8 shrink-0 place-items-center rounded-full text-xs font-semibold uppercase", tones[(hash >>> 0) % tones.length], className)}>{initials}</span>;
}