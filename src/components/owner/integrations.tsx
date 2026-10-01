import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Copy, CreditCard, Mail, MessageSquare, Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tag } from "@/components/ui/tag";
import { getIntegrations } from "@/lib/integrations.functions";

function Row({ icon, title, status, children }: { icon: React.ReactNode; title: string; status: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-start">
      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-fill-neutral text-deep-ink [&_svg]:size-5">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2"><p className="text-sm font-medium text-deep-ink">{title}</p>{status}</div>
        <div className="mt-1 text-xs leading-5 text-muted-foreground">{children}</div>
      </div>
    </li>
  );
}

/** Connections Claire relies on: her calendar, email, texts and payments. */
export function Integrations() {
  const fetchIt = useServerFn(getIntegrations);
  const q = useQuery({ queryKey: ["owner", "integrations"], queryFn: () => fetchIt() });
  if (q.isLoading) return <Skeleton className="h-64 rounded-2xl" />;
  if (!q.data) return null;
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const feed = `${origin}/api/public/calendar/${q.data.calendarToken}.ics`;
  const google = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(feed.replace(/^https?:/, "webcal:"))}`;
  const copy = async () => { try { await navigator.clipboard.writeText(feed); toast.success("Calendar link copied."); } catch { toast.error("Couldn't copy."); } };

  return (
    <ul className="divide-y divide-border">
      <Row icon={<CalendarDays />} title="Google Calendar" status={<Tag tone="success">Ready</Tag>}>
        <p>Every booking, move and cancellation shows up in your own calendar within a few hours. Works with Google, Apple and Outlook.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button asChild size="sm"><a href={google} target="_blank" rel="noreferrer">Add to Google Calendar</a></Button>
          <Button size="sm" variant="secondary" onClick={copy}><Copy />Copy calendar link</Button>
        </div>
        <p className="mt-2">Keep this link private. Anyone with it can see appointment times and client names.</p>
      </Row>
      <VideoLinkRow />
      <Row icon={<Mail />} title="Email" status={q.data.email.connected ? <Tag tone="success">Connected</Tag> : <Tag tone="warning">Not connected</Tag>}>
        {q.data.email.connected
          ? <p>Confirmations, reminders and signature requests go out from <span className="text-deep-ink">{q.data.email.from}</span>.</p>
          : <p>Add a Resend API key to send confirmations and reminders by email. Until then, messages are only logged in Report.</p>}
      </Row>
      <Row icon={<MessageSquare />} title="Text messages" status={q.data.sms.connected ? <Tag tone="success">Connected</Tag> : <Tag>Demo mode</Tag>}>
        {q.data.sms.connected
          ? <p>Reminders are also sent by text.</p>
          : <p>Texts are written and logged in Report, but not sent. Connect Twilio to send them to clients' phones.</p>}
      </Row>
      <Row icon={<CreditCard />} title="Payments" status={q.data.payments.connected ? <Tag tone="success">Connected</Tag> : <Tag>Not connected</Tag>}>
        <p>Clients pay after the appointment, when they sign Form 8879. {q.data.payments.connected ? "Card payments are taken online." : "Until Stripe is turned on, clients see a clearly labeled test payment button."}</p>
      </Row>
    </ul>
  );
}

function VideoLinkRow() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["owner", "video-link"], queryFn: async () => { const { data, error } = await supabase.from("settings").select("video_link").eq("id", 1).maybeSingle(); if (error) throw error; return data?.video_link ?? ""; } });
  const [val, setVal] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (q.data !== undefined) setVal(q.data); }, [q.data]);
  const valid = val.trim() === "" || /^https:\/\/\S+$/.test(val.trim());
  const save = async () => {
    setBusy(true);
    const { error } = await supabase.from("settings").update({ video_link: val.trim() || null }).eq("id", 1);
    setBusy(false);
    if (error) toast.error("Couldn't save that."); else { toast.success("Video link saved."); void qc.invalidateQueries({ queryKey: ["owner", "video-link"] }); }
  };
  return (
    <Row icon={<Video />} title="Video meeting link" status={q.data ? <Tag tone="success">Set</Tag> : <Tag>Not set</Tag>}>
      <p>Your personal Zoom or Google Meet link. Video clients see a "Join call" button, and it's in the reminder the day before. If it's empty, each appointment gets its own private video room automatically, so there's never a link to send by hand.</p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <Input aria-label="Video meeting link" placeholder="https://meet.google.com/abc-defg-hij" value={val} onChange={(e) => setVal(e.target.value)} className="h-10 sm:max-w-sm" />
        <Button size="sm" className="h-10" disabled={!valid || busy || val === (q.data ?? "")} onClick={save}>{busy ? "Saving…" : "Save"}</Button>
      </div>
      {!valid && <p className="mt-1 text-destructive">Use a full link starting with https://</p>}
    </Row>
  );
}
