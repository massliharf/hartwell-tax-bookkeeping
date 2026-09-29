
create or replace function public.book_appointment(
  _service_id uuid, _start timestamptz, _now timestamptz,
  _name text, _email text, _phone text, _meeting_type meeting_type, _intake jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare tz text; local_d date; cid uuid; dur int; appt appointments;
begin
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
  insert into clients (name, email, phone) values (_name, lower(_email), nullif(_phone, ''))
  on conflict (email) do update set name = excluded.name, phone = coalesce(excluded.phone, clients.phone)
  returning id into cid;
  update clients set is_returning = true
   where id = cid and (coalesce((_intake->>'filed_with_us')::boolean, false)
     or exists (select 1 from appointments where client_id = cid and status = 'completed'));
  insert into appointments (client_id, service_id, start_at, end_at, meeting_type, status, intake_answers, created_at)
  values (cid, _service_id, _start, _start + make_interval(mins => dur), _meeting_type, 'booked', coalesce(_intake, '{}'::jsonb), _now)
  returning * into appt;
  perform generate_checklist(appt.id);
  return jsonb_build_object('ok', true, 'appointment_id', appt.id, 'manage_token', appt.manage_token);
end $$;
revoke execute on function public.book_appointment(uuid, timestamptz, timestamptz, text, text, text, meeting_type, jsonb) from public, anon, authenticated;
grant execute on function public.book_appointment(uuid, timestamptz, timestamptz, text, text, text, meeting_type, jsonb) to service_role;
