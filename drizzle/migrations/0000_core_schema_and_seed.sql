
create type public.app_role as enum ('admin');
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "Users read own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.is_owner() returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role(auth.uid(), 'admin')
$$;

create type public.meeting_type as enum ('in_person','video');
create type public.appointment_status as enum ('booked','confirmed','completed','cancelled','no_show','rescheduled');
create type public.signature_status as enum ('not_needed','pending','signed');
create type public.checklist_status as enum ('missing','uploaded','not_applicable');
create type public.waitlist_status as enum ('waiting','offered','booked','expired');
create type public.message_channel as enum ('email','sms');
create type public.message_type as enum ('booking_confirmation','docs_reminder_7d','readiness_check_48h','reschedule_offer','final_reminder_24h','waitlist_offer','abandoned_nudge','signature_reminder','missing_docs_after','new_season');

create table public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  duration_min int not null,
  price_from numeric(10,2) not null,
  is_from_price boolean not null default true,
  description text,
  active boolean not null default true,
  sort_order int not null default 0
);

create table public.document_rules (
  id uuid primary key default gen_random_uuid(),
  service_id uuid references public.services(id) on delete cascade,
  condition text not null,
  document_name text not null,
  description text,
  required boolean not null default true,
  active boolean not null default true,
  sort_order int not null default 0
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  phone text,
  is_returning boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  service_id uuid not null references public.services(id),
  start_at timestamptz not null,
  end_at timestamptz not null,
  meeting_type public.meeting_type not null default 'in_person',
  status public.appointment_status not null default 'booked',
  intake_answers jsonb not null default '{}'::jsonb,
  manage_token text not null unique default (replace(gen_random_uuid()::text,'-','') || replace(gen_random_uuid()::text,'-','')),
  ready_score int not null default 0,
  signature_status public.signature_status not null default 'not_needed',
  created_at timestamptz not null default now()
);
create index on public.appointments (start_at);

create table public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  document_name text not null,
  description text,
  required boolean not null default true,
  status public.checklist_status not null default 'missing',
  file_path text,
  uploaded_at timestamptz,
  sort_order int not null default 0,
  unique (appointment_id, document_name)
);

create table public.waitlist (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  service_id uuid not null references public.services(id),
  preferred_days text[] not null default '{}',
  status public.waitlist_status not null default 'waiting',
  created_at timestamptz not null default now()
);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  name text,
  partial_booking jsonb not null default '{}'::jsonb,
  last_step text,
  created_at timestamptz not null default now(),
  converted boolean not null default false,
  nudged_at timestamptz
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete set null,
  appointment_id uuid references public.appointments(id) on delete set null,
  channel public.message_channel not null default 'email',
  type public.message_type not null,
  subject text,
  body text not null,
  sent_at timestamptz not null default now(),
  minutes_saved int not null default 0
);

create table public.settings (
  id int primary key default 1 check (id = 1),
  hours jsonb not null,
  buffer_min int not null default 15,
  reminder_timings jsonb not null,
  timezone text not null default 'America/New_York',
  demo_time_offset_minutes int not null default 0
);

do $$ declare t text; begin
  foreach t in array array['services','document_rules','clients','appointments','checklist_items','waitlist','leads','messages','settings'] loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "Owner full access" on public.%I for all to authenticated using (public.is_owner()) with check (public.is_owner())', t);
  end loop;
end $$;
grant select on public.services to anon;
create policy "Anyone can view active services" on public.services for select to anon, authenticated using (active);

create or replace function public.generate_checklist(_appointment_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare a record; ans jsonb; r record; emp text;
begin
  select ap.*, c.is_returning into a from appointments ap join clients c on c.id = ap.client_id where ap.id = _appointment_id;
  if not found then return; end if;
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

create or replace function public.recalc_ready_score()
returns trigger language plpgsql security definer set search_path = public as $$
declare _id uuid := coalesce(new.appointment_id, old.appointment_id); total int; done int;
begin
  select count(*) filter (where required and status <> 'not_applicable'),
         count(*) filter (where required and status = 'uploaded')
    into total, done from checklist_items where appointment_id = _id;
  update appointments set ready_score = case when total = 0 then 100 else round(100.0 * done / total) end where id = _id;
  return null;
end $$;
create trigger checklist_ready_score after insert or update or delete on public.checklist_items
  for each row execute function public.recalc_ready_score();

insert into public.services (name, slug, duration_min, price_from, is_from_price, description, sort_order) values
 ('Individual return','individual',45,250,true,'W-2 income, standard or itemized.',1),
 ('Self-employed / freelancer','self-employed',75,450,true,'1099 income and Schedule C.',2),
 ('Rental property','rental',60,400,true,'Income, expenses and depreciation.',3),
 ('Extension / IRS letter review','extension',30,150,false,'File on time, or understand a notice.',4),
 ('Small business bookkeeping consult','bookkeeping',60,200,false,'Get your books clean and simple.',5);

insert into public.document_rules (service_id, condition, document_name, description, required, sort_order) values
 (null,'always','Photo ID','Driver''s license or passport. A clear phone photo is fine.',true,1),
 (null,'new_client','Last year''s tax return','Your full federal and state return from last year.',true,2),
 (null,'w2','W-2 from {employer}','Sent by your employer in January.',true,10),
 (null,'freelance','1099-NEC or 1099-K','From clients or payment apps that paid you.',true,20),
 (null,'freelance','Income & expense summary','A simple list or spreadsheet of what came in and went out.',true,21),
 (null,'freelance','Home office details','Square footage of your office and of your home.',false,22),
 (null,'interest','1099-INT','Interest statement from your bank.',true,30),
 (null,'investments','1099-B','Brokerage statement showing sales of stocks or funds.',true,31),
 (null,'mortgage','1098 mortgage interest statement','From your mortgage lender.',true,40),
 (null,'student_loans','1098-E','Student loan interest statement from your servicer.',true,41),
 (null,'dependents','Childcare provider info and costs','Provider name, address, tax ID and total paid.',true,50),
 (null,'rental','Rental income & expenses','Rent received, repairs, insurance, management fees.',true,60),
 (null,'rental','Property tax bill','Your latest property tax bill for the rental.',true,61),
 ((select id from public.services where slug='extension'),'service','The IRS letter','Every page of the notice, front and back.',false,70),
 ((select id from public.services where slug='extension'),'service','Prior year return','The return the letter or extension relates to.',true,71);

insert into public.settings (id, hours, buffer_min, reminder_timings, demo_time_offset_minutes) values (1,
 '{"mon":["09:00","18:00"],"tue":["09:00","18:00"],"wed":["09:00","18:00"],"thu":["09:00","18:00"],"fri":["09:00","18:00"],"sat":["10:00","14:00"],"sun":null}',
 15,
 '{"docs_reminder_days":7,"readiness_check_hours":48,"final_reminder_hours":24,"signature_reminder_days":2,"abandoned_nudge_hours":24}',
 greatest(0, floor(extract(epoch from ((timestamp '2026-10-01 08:00' at time zone 'America/New_York') - now())) / 60))::int
);

do $$
declare
  names text[] := array['Anita Raman','Marcus Lee','Deepa Shah','Raj Shah','Wei Zhang','Mei Lin Chen','Jae-won Park','Soo-jin Kim','Carlos Mendoza','Lucia Hernandez','Giovanni Russo','Maria DeLuca','Sean O''Brien','Kathleen Murphy','Darnell Washington','Keisha Johnson','Maricel Santos','Jose Reyes','Piotr Kowalski','Agnieszka Nowak','Omar Haddad','Layla Mansour','Vikram Iyer','Sunita Reddy','Arjun Mehta','Kavya Nair','Hiroshi Tanaka','Yuki Sato','Daniel Goldberg','Rachel Klein','Amit Desai','Neha Kapoor','Tomasz Wisniewski','Fatima Ahmed','Samuel Okafor','Grace Adeyemi','Michael Thompson','Jennifer Walsh','Clairenka Joshi','Rohan Gupta','Elena Petrova','Ahmed Khalil','Nicole Brennan','Kevin Nguyen','Linh Tran'];
  employers text[] := array['Johnson & Johnson','Rutgers University','Hackensack Meridian Health','JFK University Medical Center','Wakefern Food Corp','Siemens Healthineers','Middlesex County','Montclair Public Schools','Novo Nordisk','Verizon'];
  client_ids uuid[] := '{}';
  cid uuid; aid uuid; svc record; fn text; ln text;
  i int; d date; t time; slots time[]; st timestamptz; ci int := 0;
  intake jsonb; frac numeric; roll numeric; sslug text; n int;
begin
  perform setseed(0.4215);
  for i in 1..array_length(names,1) loop
    fn := split_part(names[i],' ',1);
    ln := substr(names[i], length(fn) + 2);
    insert into clients (name, email, phone, is_returning, created_at)
    values (names[i],
            lower(regexp_replace(fn,'[^A-Za-z]','','g')) || '.' || lower(regexp_replace(ln,'[^A-Za-z]','','g')) || '@example.com',
            '(973) 555-' || lpad((100 + i)::text, 4, '0'),
            random() < 0.6,
            now() - (interval '1 day' * (30 + floor(random()*900))))
    returning id into cid;
    client_ids := client_ids || cid;
  end loop;

  for d in select generate_series(date '2026-10-01', date '2026-10-14', interval '1 day')::date loop
    if extract(dow from d) = 0 then continue; end if;
    slots := case when extract(dow from d) = 6 then array['10:00','11:30']::time[]
                  else array['09:00','10:30','12:00','13:30','15:00','16:30']::time[] end;
    foreach t in array slots loop
      if random() > (case when d >= date '2026-10-08' then 0.93 else 0.55 end) then continue; end if;
      ci := ci + 1;
      cid := client_ids[1 + (ci - 1) % array_length(client_ids,1)];
      roll := random();
      sslug := case when roll < 0.40 then 'extension' when roll < 0.65 then 'individual' when roll < 0.82 then 'self-employed' when roll < 0.94 then 'rental' else 'bookkeeping' end;
      select * into svc from services where services.slug = sslug;
      intake := jsonb_build_object(
        'w2_employers', case when sslug = 'bookkeeping' then '[]'::jsonb
                             when sslug = 'individual' and random() < 0.3 then jsonb_build_array(employers[1+floor(random()*10)::int], employers[1+floor(random()*10)::int])
                             when sslug = 'self-employed' and random() < 0.6 then '[]'::jsonb
                             else jsonb_build_array(employers[1+floor(random()*10)::int]) end,
        'freelance', sslug in ('self-employed','bookkeeping'),
        'interest', random() < 0.5,
        'investments', random() < 0.25,
        'mortgage', sslug = 'rental' or random() < 0.4,
        'student_loans', random() < 0.2,
        'dependents', random() < 0.3,
        'rental', sslug = 'rental',
        'irs_letter', sslug = 'extension' and random() < 0.3);
      st := (d + t) at time zone 'America/New_York';
      insert into appointments (client_id, service_id, start_at, end_at, meeting_type, status, intake_answers, created_at)
      values (cid, svc.id, st, st + make_interval(mins => svc.duration_min),
              case when random() < 0.35 then 'video'::meeting_type else 'in_person'::meeting_type end,
              case when random() < 0.5 then 'confirmed'::appointment_status else 'booked'::appointment_status end,
              intake, st - interval '1 day' * (3 + floor(random()*20)))
      returning id into aid;
      perform generate_checklist(aid);

      roll := random();
      frac := case when roll < 0.35 then 1 when roll < 0.70 then 0.4 + random()*0.2 when roll < 0.82 then 0 else 0.7 + random()*0.2 end;
      select count(*) into n from checklist_items where appointment_id = aid;
      update checklist_items set status = 'uploaded', uploaded_at = st - interval '1 hour' * (24 + floor(random()*200))
      where id in (select x.id from checklist_items x where x.appointment_id = aid order by x.sort_order, x.document_name limit ceil(n * frac)::int);
    end loop;
  end loop;

  for i in 1..16 loop
    ci := ci + 1;
    cid := client_ids[1 + (ci * 7) % array_length(client_ids,1)];
    select * into svc from services order by random() limit 1;
    st := ((date '2026-09-08' + (i * 1.3)::int) + (array['09:00','10:30','13:30','15:00']::time[])[1 + i % 4]) at time zone 'America/New_York';
    insert into appointments (client_id, service_id, start_at, end_at, meeting_type, status, intake_answers, signature_status, created_at)
    values (cid, svc.id, st, st + make_interval(mins => svc.duration_min),
            case when i % 3 = 0 then 'video'::meeting_type else 'in_person'::meeting_type end,
            case when i in (4, 11) then 'no_show'::appointment_status else 'completed'::appointment_status end,
            jsonb_build_object('w2_employers', jsonb_build_array(employers[1 + i % 10]), 'interest', i % 2 = 0),
            case when i in (4, 11) then 'not_needed'::signature_status when i in (2,6,9,13,15) then 'pending'::signature_status else 'signed'::signature_status end,
            st - interval '10 days')
    returning id into aid;
    perform generate_checklist(aid);
    if i not in (4, 11) then
      update checklist_items set status = 'uploaded', uploaded_at = st - interval '2 days' where appointment_id = aid;
    end if;
  end loop;

  insert into waitlist (client_id, service_id, preferred_days, created_at) values
   (client_ids[3], (select id from services where slug='extension'), array['sat'], now() - interval '3 days'),
   (client_ids[9], (select id from services where slug='individual'), array['mon','tue'], now() - interval '2 days'),
   (client_ids[17], (select id from services where slug='self-employed'), array['thu','fri'], now() - interval '5 days'),
   (client_ids[26], (select id from services where slug='extension'), array['sat','fri'], now() - interval '1 day'),
   (client_ids[38], (select id from services where slug='rental'), array['wed'], now() - interval '4 days');

  insert into leads (email, name, partial_booking, last_step, created_at, nudged_at) values
   ('brian.castillo@example.com','Brian Castillo','{"service":"extension"}','choose_time', now() - interval '20 hours', null),
   ('sneha.pillai@example.com','Sneha Pillai','{"service":"self-employed","slot":"2026-10-09T15:00"}','contact_details', now() - interval '2 days', null),
   ('tom.fitzgerald@example.com',null,'{"service":"rental"}','intake', now() - interval '6 hours', null),
   ('ayesha.malik@example.com','Ayesha Malik','{"service":"individual","slot":"2026-10-13T10:30"}','intake', now() - interval '3 days', now() - interval '1 day');

  insert into messages (client_id, appointment_id, channel, type, subject, body, sent_at, minutes_saved)
  select a.client_id, a.id, 'email', 'booking_confirmation', 'You''re booked with Claire',
         'Your appointment is confirmed. Your document checklist is ready whenever you are.', a.created_at, 6
  from appointments a where a.start_at >= timestamptz '2026-10-01' order by a.start_at limit 8;
  insert into messages (client_id, appointment_id, channel, type, subject, body, sent_at, minutes_saved)
  select a.client_id, a.id, 'email', 'signature_reminder', 'One signature left: Form 8879',
         'Your return is ready to file. Please sign Form 8879 so we can e-file it.', a.start_at + interval '2 days', 8
  from appointments a where a.signature_status = 'pending';
  insert into messages (client_id, appointment_id, channel, type, subject, body, sent_at, minutes_saved)
  select a.client_id, a.id, 'sms', 'docs_reminder_7d', null,
         'Hartwell Tax: your appointment is in a week. A few documents are still on your list.', a.start_at - interval '7 days', 4
  from appointments a where a.ready_score < 60 and a.start_at >= timestamptz '2026-10-05' order by a.start_at limit 5;
end $$;
