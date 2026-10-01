create or replace function public.generate_checklist(_appointment_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare a record; ans jsonb; r record; emp text; slug text;
begin
  select ap.*, c.is_returning into a from appointments ap join clients c on c.id = ap.client_id where ap.id = _appointment_id;
  if not found then return; end if;
  select s.slug into slug from services s where s.id = a.service_id;
  if slug = 'intro' then
    delete from checklist_items where appointment_id = _appointment_id and status = 'missing';
    update appointments set ready_score = 100 where id = _appointment_id;
    return;
  end if;
  ans := coalesce(a.intake_answers, '{}'::jsonb);
  delete from checklist_items where appointment_id = _appointment_id and status = 'missing';
  for r in select * from document_rules where active order by sort_order loop
    if r.condition = 'always'
       or (r.condition = 'new_client' and not a.is_returning)
       or (r.condition = 'service' and r.service_id = a.service_id)
       or (r.condition not in ('always','new_client','service','w2') and coalesce((ans->>r.condition)::boolean, false)) then
      insert into checklist_items (appointment_id, document_name, description, required, sort_order)
      values (_appointment_id, r.document_name, r.description, r.required, r.sort_order)
      on conflict (appointment_id, document_name) do nothing;
    elsif r.condition = 'w2' and jsonb_typeof(ans->'w2_employers') = 'array' then
      for emp in select jsonb_array_elements_text(ans->'w2_employers') loop
        insert into checklist_items (appointment_id, document_name, description, required, sort_order)
        values (_appointment_id, replace(r.document_name, '{employer}', emp), r.description, r.required, r.sort_order)
        on conflict (appointment_id, document_name) do nothing;
      end loop;
    end if;
  end loop;
end $$;
revoke execute on function public.generate_checklist(uuid) from public, anon, authenticated;
grant execute on function public.generate_checklist(uuid) to service_role;