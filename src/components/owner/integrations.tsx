import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CalendarDays, Copy, CreditCard, Mail, MessageSquare } from "lucide-react";
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
        <p>Clients pay after the appointment, when they sign Form 8879. Connect Stripe to take card payments online.</p>
      </Row>
    </ul>
  );
}
