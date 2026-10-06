-- MontaPC: campo opcional para imagem oficial/licenciada do componente.
alter table public.montapc_components
  add column if not exists image_url text;

comment on column public.montapc_components.image_url is
  'Optional HTTPS image URL from an authorized/licensed source. Never required for recommendation.';
