
create or replace function public.available_slots(_service_id uuid, _from date, _to date, _now timestamptz)
returns setof timestamptz language plpgsql stable security definer set search_path = public as $$
declare s settings; dur int; d date; hrs jsonb; t timestamptz;
begin
  select * into s from settings where id = 1;
  select duration_min into dur from services where id = _service_id and active;
  if dur is null or _to < _from or _to - _from > 62 then return; end if;
  for d in select generate_series(_from, _to, interval '1 day')::date loop
    hrs := s.hours -> lower(to_char(d, 'dy'));
    if hrs is null or jsonb_typeof(hrs) <> 'array' then continue; end if;
    for t in select generate_series(
        (d + (hrs->>0)::time) at time zone s.timezone,
        (d + (hrs->>1)::time) at time zone s.timezone - make_interval(mins => dur),
        interval '15 minutes') loop
      continue when t < _now + interval '3 hours';
      continue when exists (
        select 1 from appointments a
        where a.status in ('booked','confirmed')
          and a.start_at < t + make_interval(mins => dur + s.buffer_min)
          and a.end_at + make_interval(mins => s.buffer_min) > t);
      return next t;
    end loop;
  end loop;
end $$;

create or replace function public.book_appointment(
  _service_id uuid, _start timestamptz, _now timestamptz,
  _name text, _email text, _phone text, _meeting_type meeting_type, _intake jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare tz text; local_d date; cid uuid; dur int; appt appointments;
begin
  -- Serialize all bookings (solo practice) so the re-check + insert is atomic.
  perform pg_advisory_xact_lock(hashtext('patel_booking'));
  select timezone into tz from settings where id = 1;
  local_d := (_start at time zone tz)::date;
  if not exists (select 1 from available_slots(_service_id, local_d, local_d, _now) x where x = _start) then
    return jsonb_build_object('ok', false, 'alternatives', coalesce((
      select jsonb_agg(x order by abs(extract(epoch from x - _start)))
      from (select x from available_slots(_service_id, greatest(local_d - 7, (_now at time zone tz)::date), local_d + 14, _now) x
            order by abs(extract(epoch from x - _start)) limit 3) q), '[]'::jsonb));
  end if;
  select duration_min into dur from services where id = _service_id;
  insert into clients (name, email, phone) values (_name, lower(_email), _phone)
  on conflict (email) do update set name = excluded.name, phone = coalesce(excluded.phone, clients.phone)
  returning id into cid;
  update clients set is_returning = true
   where id = cid and exists (select 1 from appointments where client_id = cid and status = 'completed');
  insert into appointments (client_id, service_id, start_at, end_at, meeting_type, status, intake_answers, created_at)
  values (cid, _service_id, _start, _start + make_interval(mins => dur), _meeting_type, 'booked', coalesce(_intake, '{}'::jsonb), _now)
  returning * into appt;
  perform generate_checklist(appt.id);
  return jsonb_build_object('ok', true, 'appointment_id', appt.id, 'manage_token', appt.manage_token);
end $$;

revoke execute on function public.available_slots(uuid, date, date, timestamptz) from public, anon, authenticated;
revoke execute on function public.book_appointment(uuid, timestamptz, timestamptz, text, text, text, meeting_type, jsonb) from public, anon, authenticated;
grant execute on function public.available_slots(uuid, date, date, timestamptz) to service_role;
grant execute on function public.book_appointment(uuid, timestamptz, timestamptz, text, text, text, meeting_type, jsonb) to service_role;
