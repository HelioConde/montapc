-- MontaPC security hardening
-- Reviewed against current Supabase RLS guidance on 2026-10-07.
-- Keep service roles/admin roles unchanged; narrow only browser-facing anon/authenticated privileges.

-- Least-privilege grants for browser-facing roles.
revoke all privileges on table public.montapc_components from anon, authenticated;
grant select on table public.montapc_components to anon, authenticated;

revoke all privileges on table public.montapc_builds from anon, authenticated;
grant select on table public.montapc_builds to anon;
grant select, insert, update, delete on table public.montapc_builds to authenticated;

revoke all privileges on table public.montapc_build_items from anon, authenticated;
grant select on table public.montapc_build_items to anon;
grant select, insert, update, delete on table public.montapc_build_items to authenticated;

revoke all privileges on table public.montapc_price_snapshots from anon, authenticated;
grant select on table public.montapc_price_snapshots to anon, authenticated;

revoke all privileges on table public.montapc_events from anon, authenticated;
grant insert on table public.montapc_events to anon, authenticated;

revoke all privileges on table public.montapc_feedback from anon, authenticated;
grant insert on table public.montapc_feedback to anon, authenticated;

-- Build items must belong both to the signed-in user AND to a build owned by that same user.
-- This prevents attaching an otherwise-owned row to another user's build_id.
drop policy if exists "montapc build items owner insert" on public.montapc_build_items;
create policy "montapc build items owner insert"
on public.montapc_build_items
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.montapc_builds b
    where b.id = build_id
      and b.user_id = (select auth.uid())
  )
);

drop policy if exists "montapc build items owner update" on public.montapc_build_items;
create policy "montapc build items owner update"
on public.montapc_build_items
for update
to authenticated
using (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.montapc_builds b
    where b.id = build_id
      and b.user_id = (select auth.uid())
  )
)
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.montapc_builds b
    where b.id = build_id
      and b.user_id = (select auth.uid())
  )
);

-- Existing DELETE policy intentionally remains user_id based so a user can remove
-- any legacy row they own, including rows created before this hardening patch.
