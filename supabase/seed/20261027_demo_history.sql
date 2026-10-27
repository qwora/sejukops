-- Demo history so the KPI dashboard and Operations assistant have two weeks of data.
-- Every row is tagged "[demo]" in admin_notes. Remove with:
--   delete from public.orders where admin_notes like '%[demo]%';
-- Runs once: skipped if demo rows already exist.

do $$
begin
  if exists (select 1 from public.orders where admin_notes like '%[demo]%') then
    raise notice 'Demo history already present, skipping.';
    return;
  end if;

  -- Completed jobs (closed / reviewed / job_done) with completions
  with v (cust, phone, addr, branch, svc, quote, tech, at, work, extra, pay, status, reschedules) as (values
    ('Farah Idris','60111000101','12, Jalan SS15/4, Subang Jaya','Petaling Jaya','Aircond cleaning',160,'Ali','2026-10-19 10:00+08','Cleaned 2 wall units and flushed drain pipe.',0,'Cash','closed',0),
    ('Kumar Selvam','60111000102','8, Jalan Kenari, Puchong','Petaling Jaya','Gas refill',220,'Bala','2026-10-19 14:00+08','Topped up R32 gas, checked pressure.',0,'QR payment','closed',0),
    ('Lim Hui Min','60111000103','B-12-3, Residensi Wangsa, KL','Kuala Lumpur','Wall-mounted repair',320,'John','2026-10-20 09:30+08','Replaced fan capacitor, unit cooling normally.',60,'Bank transfer','closed',1),
    ('Restoran Mak Teh','60111000104','23, Jalan Pasar, Klang','Shah Alam','Preventive maintenance',450,'Ali','2026-10-20 15:00+08','Quarterly maintenance on 3 ceiling cassettes.',0,'Bank transfer','closed',0),
    ('Nurul Ain','60111000105','5, Jalan Langkasuka, Kuah','Langkawi','Aircond cleaning',160,'Yusoff','2026-10-21 11:00+08','Chemical wash for 1 unit.',40,'Cash','closed',0),
    ('Daniel Wong','60111000106','17, Jalan Bukit, Bangsar','Kuala Lumpur','Installation',850,'John','2026-10-21 13:00+08','Installed 1.5HP inverter unit with bracket.',120,'Bank transfer','closed',0),
    ('Aishah Karim','60111000107','30, Jalan Kemuning, Shah Alam','Shah Alam','Gas refill',220,'Ali','2026-10-22 10:30+08','Gas top-up and leak check.',0,'QR payment','closed',0),
    ('Kedai Runcit Ah Seng','60111000108','2, Jalan Gasing, PJ','Petaling Jaya','Wall-mounted repair',320,'Bala','2026-10-22 16:00+08','Fixed water leak, cleared blocked drain.',0,'Cash','closed',1),
    ('Haris Fadzil','60111000109','44, Jalan Teluk, Penang','Penang','Aircond cleaning',160,'Yusoff','2026-10-23 09:00+08','Cleaned 2 units.',0,'Cash','closed',0),
    ('Siti Hajar','60111000110','9, Jalan Mawar, Cheras','Kuala Lumpur','Preventive maintenance',300,'John','2026-10-23 14:30+08','Maintenance on 2 units.',0,'QR payment','closed',0),
    ('Rajesh Nair','60111000111','61, Jalan SS2/24, PJ','Petaling Jaya','Gas refill',220,'Bala','2026-10-24 10:00+08','Gas refill, replaced valve cap.',30,'Cash','closed',0),
    ('Tan Mei Ling','60111000112','12, Jalan Setia, Setia Alam','Shah Alam','Aircond cleaning',160,'Ali','2026-10-24 15:00+08','Cleaned 2 units.',0,'QR payment','closed',0),
    ('Pejabat Guaman Azlan','60111000113','Level 3, Wisma Pantai, Langkawi','Langkawi','Installation',1250,'Yusoff','2026-10-25 10:00+08','Installed 2 wall units in office.',0,'Bank transfer','closed',0),
    ('Mohd Rizal','60111000114','3, Jalan Damai, Petaling Jaya','Petaling Jaya','Wall-mounted repair',320,'Bala','2026-10-25 13:30+08','Replaced thermistor sensor.',80,'Cash','closed',0),
    -- this week
    ('Chong Wei Jie','60111000115','22, Jalan PJU 1, Ara Damansara','Petaling Jaya','Aircond cleaning',160,'Bala','2026-10-26 09:00+08','Cleaned 2 units.',0,'Cash','reviewed',0),
    ('Norhayati Salleh','60111000116','7, Jalan Kenanga, Shah Alam','Shah Alam','Gas refill',220,'Bala','2026-10-26 11:30+08','Gas top-up.',0,'QR payment','reviewed',0),
    ('Vincent Lau','60111000117','15, Jalan Tun Razak, KL','Kuala Lumpur','Wall-mounted repair',320,'John','2026-10-26 14:00+08','Fixed noisy indoor fan.',0,'Bank transfer','reviewed',0),
    ('Kafe Kopi Kita','60111000118','1, Jalan Bayu, Kuah','Langkawi','Preventive maintenance',450,'Yusoff','2026-10-26 15:30+08','Maintenance on 3 units.',0,'Bank transfer','reviewed',0),
    ('Zulkifli Hassan','60111000119','40, Jalan SS21, Damansara Utama','Petaling Jaya','Aircond cleaning',160,'Bala','2026-10-26 17:00+08','Cleaned 1 unit, drain flush.',40,'Cash','reviewed',1),
    ('Priya Menon','60111000120','8, Jalan Sentul, KL','Kuala Lumpur','Gas refill',220,'Bala','2026-10-27 09:00+08','Gas refill.',0,'QR payment','job_done',0),
    ('Hotel Seri Pantai','60111000121','Jalan Pantai Cenang, Langkawi','Langkawi','Wall-mounted repair',380,'Bala','2026-10-27 10:30+08','Replaced compressor relay and 2 capacitors.',420,'Bank transfer','job_done',0),
    ('Amirul Hakim','60111000122','19, Jalan Pinang, Penang','Penang','Aircond cleaning',160,'John','2026-10-27 11:00+08','Cleaned 2 units.',0,'Cash','job_done',0)
  ),
  ins as (
    insert into public.orders (customer_name, customer_phone, address, problem_description, service_type, quoted_price,
                               assigned_technician_id, branch, status, admin_notes, created_at, scheduled_at, reschedule_count)
    select v.cust, v.phone, v.addr, 'Customer reported: ' || lower(v.svc) || ' needed.', v.svc, v.quote,
           t.id, v.branch, v.status::order_status, '[demo]', v.at::timestamptz - interval '1 day', v.at::timestamptz, v.reschedules
    from v join public.technicians t on t.name = v.tech
    returning id, customer_name
  )
  insert into public.service_completions (order_id, technician_id, work_done, extra_charges, final_amount, remarks,
                                          payment_amount, payment_method, completed_at, extra_items)
  select ins.id, t.id, v.work, v.extra, v.quote + v.extra, '', v.quote + v.extra, v.pay,
         v.at::timestamptz + interval '95 minutes',
         case when v.extra > 0 then jsonb_build_array(jsonb_build_object('label', 'Parts and extra work', 'amount', v.extra)) else '[]'::jsonb end
  from ins join v on v.cust = ins.customer_name join public.technicians t on t.name = v.tech;

  -- Open jobs for today
  insert into public.orders (customer_name, customer_phone, address, problem_description, service_type, quoted_price,
                             assigned_technician_id, branch, status, admin_notes, created_at, scheduled_at)
  select v.cust, v.phone, v.addr, v.problem, v.svc, v.quote, t.id, v.branch, v.status::order_status,
         '[demo] ' || v.note, now() - interval '3 hours', v.at::timestamptz
  from (values
    ('Hafiz Rahman','60111000123','23, Jalan Anggerik, Kota Kemuning','Shah Alam','Indoor unit dripping water.','Wall-mounted repair',180,'Ali','2026-10-27 15:00+08','assigned','Call before arrival.'),
    ('Grace Tan','60111000124','11, Jalan Puteri, Puchong','Petaling Jaya','Weak airflow from bedroom unit.','Aircond cleaning',160,'John','2026-10-27 16:30+08','assigned',''),
    ('Restoran Nasi Kandar Ali','60111000125','88, Jalan Meru, Klang','Shah Alam','Compressor not starting.','Wall-mounted repair',650,null,'2026-10-28 10:00+08','new','Needs senior technician.'),
    ('Mei Ling Chua','60111000126','5, Jalan SS2/72, PJ','Petaling Jaya','Annual servicing for 3 units.','Preventive maintenance',450,null,'2026-10-28 14:00+08','new','')
  ) as v (cust, phone, addr, branch, problem, svc, quote, tech, at, status, note)
  left join public.technicians t on t.name = v.tech;

  -- Activity history for demo rows
  insert into public.activity_logs (order_id, action, previous_status, new_status, metadata, created_at)
  select o.id, 'order_created', null, 'new', jsonb_build_object('actor', 'Admin', 'seed', true), o.created_at
  from public.orders o where o.admin_notes like '%[demo]%';

  insert into public.activity_logs (order_id, action, previous_status, new_status, metadata, created_at)
  select c.order_id, 'job_completed', 'in_progress', 'job_done', jsonb_build_object('actor', t.name, 'seed', true), c.completed_at
  from public.service_completions c
  join public.orders o on o.id = c.order_id and o.admin_notes like '%[demo]%'
  join public.technicians t on t.id = c.technician_id;
end $$;
