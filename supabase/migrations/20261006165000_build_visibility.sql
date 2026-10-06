-- MontaPC: favoritos e compartilhamento público controlado por RLS.

alter table public.montapc_builds
  add column if not exists is_favorite boolean not null default false,
  add column if not exists visibility text not null default 'private'
    check (visibility in ('private','public'));

create index if not exists montapc_builds_public_updated_idx
  on public.montapc_builds(updated_at desc)
  where visibility = 'public';

drop policy if exists "montapc public builds read" on public.montapc_builds;
create policy "montapc public builds read"
  on public.montapc_builds
  for select
  to anon, authenticated
  using (visibility = 'public');

drop policy if exists "montapc public build items read" on public.montapc_build_items;
create policy "montapc public build items read"
  on public.montapc_build_items
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.montapc_builds b
      where b.id = montapc_build_items.build_id
        and b.visibility = 'public'
    )
  );
