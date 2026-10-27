-- Demo evidence + extra workload for Bala. Runs once (skips if already applied).
-- Images live in storage at service-evidence/demo/unit-before.jpg and unit-after.jpg.
do $$
begin
  if exists (select 1 from public.service_files where file_path like 'demo/%') then
    raise notice 'Demo evidence already present, skipping.';
    return;
  end if;

  -- Two more Bala jobs today so the overload insight has a clear signal
  with v (cust, phone, addr, svc, quote, at) as (values
    ('Sri Murugan Textiles','60111000127','14, Jalan Tengku Kelana, Klang','Aircond cleaning',220,'2026-10-27 12:30+08'),
    ('Ong Kah Wai','60111000128','9, Jalan SS3/39, Petaling Jaya','Gas refill',220,'2026-10-27 14:00+08')
  ),
  ins as (
    insert into public.orders (customer_name, customer_phone, address, problem_description, service_type, quoted_price,
                               assigned_technician_id, branch, status, admin_notes, created_at, scheduled_at)
    select v.cust, v.phone, v.addr, 'Customer reported: ' || lower(v.svc) || ' needed.', v.svc, v.quote,
           (select id from public.technicians where name = 'Bala'), 'Petaling Jaya', 'reviewed', '[demo]',
           v.at::timestamptz - interval '1 day', v.at::timestamptz
    from v
    returning id, customer_name
  )
  insert into public.service_completions (order_id, technician_id, work_done, extra_charges, final_amount, remarks, payment_amount, payment_method, completed_at)
  select ins.id, (select id from public.technicians where name = 'Bala'), 'Serviced and tested, all units cooling normally.', 0, v.quote, '', v.quote, 'QR payment', v.at::timestamptz + interval '80 minutes'
  from ins join v on v.cust = ins.customer_name;

  -- Before/after photos on demo completions, except two left without evidence on purpose
  insert into public.service_files (order_id, completion_id, file_path, file_name, file_type)
  select c.order_id, c.id, p.path, p.name, 'image/jpeg'
  from public.service_completions c
  join public.orders o on o.id = c.order_id and o.admin_notes like '%[demo]%'
  cross join (values ('demo/unit-before.jpg', 'unit-before.jpg'), ('demo/unit-after.jpg', 'unit-after.jpg')) as p (path, name)
  where o.customer_name not in ('Hotel Seri Pantai', 'Priya Menon');
end $$;

select
  (select count(*) from public.service_files where file_path like 'demo/%') as demo_files,
  (select count(*) from public.service_completions c join public.technicians t on t.id = c.technician_id
     where t.name = 'Bala' and c.completed_at >= '2026-10-26T00:00:00+08') as bala_this_week;
