
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
    -- appointment must end strictly before closing time
    for t in select generate_series(
        (d + (hrs->>0)::time) at time zone s.timezone,
        (d + (hrs->>1)::time) at time zone s.timezone - make_interval(mins => dur) - interval '1 minute',
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
revoke execute on function public.available_slots(uuid, date, date, timestamptz) from public, anon, authenticated;
grant execute on function public.available_slots(uuid, date, date, timestamptz) to service_role;
