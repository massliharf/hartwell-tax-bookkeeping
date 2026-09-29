
alter table public.checklist_items add column if not exists na_reason text;
alter table public.appointments add column if not exists signed_name text;
alter table public.appointments add column if not exists signed_at timestamptz;

-- Ready = (uploaded + not applicable) required / required, +10 if confirmed, capped at 100.
create or replace function public.compute_ready_score(_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare total int; done int; st appointment_status; score int;
begin
  select count(*) filter (where required),
         count(*) filter (where required and status in ('uploaded','not_applicable'))
    into total, done from checklist_items where appointment_id = _id;
  select status into st from appointments where id = _id;
  score := case when total = 0 then 100 else round(100.0 * done / total) end;
  if st = 'confirmed' then score := score + 10; end if;
  update appointments set ready_score = least(100, score) where id = _id and ready_score is distinct from least(100, score);
end $$;

create or replace function public.recalc_ready_score()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform compute_ready_score(coalesce(new.appointment_id, old.appointment_id));
  return null;
end $$;

create or replace function public.recalc_ready_on_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform compute_ready_score(new.id);
  return null;
end $$;

drop trigger if exists appointment_status_ready on public.appointments;
create trigger appointment_status_ready after update of status on public.appointments
for each row when (old.status is distinct from new.status) execute function public.recalc_ready_on_status();

-- Move an appointment atomically; same lock as booking so no double-booking.
create or replace function public.reschedule_appointment(_id uuid, _start timestamptz, _now timestamptz)
returns jsonb language plpgsql security definer set search_path = public as $$
declare tz text; local_d date; prev appointment_status; sid uuid; dur int;
begin
  perform pg_advisory_xact_lock(hashtext('patel_booking'));
  select status, service_id into prev, sid from appointments where id = _id;
  if prev is null or prev not in ('booked','confirmed') then
    return jsonb_build_object('ok', false, 'alternatives', '[]'::jsonb);
  end if;
  select timezone into tz from settings where id = 1;
  local_d := (_start at time zone tz)::date;
  update appointments set status = 'rescheduled' where id = _id; -- free own slot for the check
  if not exists (select 1 from available_slots(sid, local_d, local_d, _now) x where x = _start) then
    update appointments set status = prev where id = _id;
    return jsonb_build_object('ok', false, 'alternatives', coalesce((
      select jsonb_agg(x order by abs(extract(epoch from x - _start)))
      from (select x from available_slots(sid, greatest(local_d - 7, (_now at time zone tz)::date), local_d + 14, _now) x
            order by abs(extract(epoch from x - _start)) limit 3) q), '[]'::jsonb));
  end if;
  select duration_min into dur from services where id = sid;
  update appointments set start_at = _start, end_at = _start + make_interval(mins => dur), status = 'booked' where id = _id;
  return jsonb_build_object('ok', true);
end $$;

revoke execute on function public.compute_ready_score(uuid) from public, anon, authenticated;
revoke execute on function public.reschedule_appointment(uuid, timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function public.compute_ready_score(uuid) to service_role;
grant execute on function public.reschedule_appointment(uuid, timestamptz, timestamptz) to service_role;
