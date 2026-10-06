-- MontaPC: consolidar políticas RLS de builds e adicionar índices de FKs do produto.
-- Mantém leitura pública de builds públicas para anon e authenticated sem políticas permissivas duplicadas.

drop policy if exists "montapc public builds read" on public.montapc_builds;
drop policy if exists "montapc_builds_owner_all" on public.montapc_builds;

create policy "montapc builds anon public read"
  on public.montapc_builds
  for select
  to anon
  using (visibility = 'public');

create policy "montapc builds authenticated read"
  on public.montapc_builds
  for select
  to authenticated
  using (user_id = (select auth.uid()) or visibility = 'public');

create policy "montapc builds owner insert"
  on public.montapc_builds
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "montapc builds owner update"
  on public.montapc_builds
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "montapc builds owner delete"
  on public.montapc_builds
  for delete
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "montapc public build items read" on public.montapc_build_items;
drop policy if exists "montapc_build_items_owner_all" on public.montapc_build_items;

create policy "montapc build items anon public read"
  on public.montapc_build_items
  for select
  to anon
  using (
    exists (
      select 1
      from public.montapc_builds b
      where b.id = montapc_build_items.build_id
        and b.visibility = 'public'
    )
  );

create policy "montapc build items authenticated read"
  on public.montapc_build_items
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or exists (
      select 1
      from public.montapc_builds b
      where b.id = montapc_build_items.build_id
        and b.visibility = 'public'
    )
  );

create policy "montapc build items owner insert"
  on public.montapc_build_items
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "montapc build items owner update"
  on public.montapc_build_items
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "montapc build items owner delete"
  on public.montapc_build_items
  for delete
  to authenticated
  using (user_id = (select auth.uid()));

create index if not exists montapc_events_user_idx
  on public.montapc_events(user_id)
  where user_id is not null;

create index if not exists montapc_feedback_user_idx
  on public.montapc_feedback(user_id)
  where user_id is not null;
