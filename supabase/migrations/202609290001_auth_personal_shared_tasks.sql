-- Enables per-user private tasks and a shared task list for authenticated users.
-- Existing rows remain visible by marking them shared before ownership is required.

alter table public."ToDo"
  add column if not exists owner_id uuid references auth.users(id) on delete set null;

alter table public."ToDo"
  add column if not exists is_shared boolean not null default true;

update public."ToDo"
set is_shared = true
where owner_id is null;

alter table public."ToDo"
  alter column is_shared set default false;

alter table public."ToDo" enable row level security;

-- Remove old policies so no previous permissive policy can bypass these rules.
do $$
declare
  existing_policy record;
begin
  for existing_policy in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'ToDo'
  loop
    execute format('drop policy %I on public."ToDo"', existing_policy.policyname);
  end loop;
end
$$;

revoke all on table public."ToDo" from anon;
grant select, insert, update, delete on table public."ToDo" to authenticated;

do $$
declare
  task_sequence text;
begin
  task_sequence := pg_get_serial_sequence('public."ToDo"', 'id');
  if task_sequence is not null then
    execute format('grant usage, select on sequence %s to authenticated', task_sequence);
  end if;
end
$$;

create policy "Authenticated users can view own and shared tasks"
on public."ToDo"
for select
to authenticated
using (is_shared or owner_id = (select auth.uid()));

create policy "Authenticated users can create own tasks"
on public."ToDo"
for insert
to authenticated
with check (owner_id = (select auth.uid()));

create policy "Authenticated users can update own and shared tasks"
on public."ToDo"
for update
to authenticated
using (is_shared or owner_id = (select auth.uid()))
with check (is_shared or owner_id = (select auth.uid()));

create policy "Authenticated users can delete own and shared tasks"
on public."ToDo"
for delete
to authenticated
using (is_shared or owner_id = (select auth.uid()));
