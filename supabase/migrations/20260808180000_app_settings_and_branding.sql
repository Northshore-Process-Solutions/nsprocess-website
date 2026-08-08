-- Company branding configurable from CRM Settings (one row per install).

create table if not exists public.app_settings (
  id boolean primary key default true check (id),
  company_name text not null,
  portal_name text not null,
  tagline text,
  phone text,
  email text,
  service_area text,
  logo_path text,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

alter table public.app_settings enable row level security;

create policy "Authenticated users can read app settings"
  on public.app_settings for select to authenticated
  using (true);

create policy "Authenticated users can insert app settings"
  on public.app_settings for insert to authenticated
  with check (true);

create policy "Authenticated users can update app settings"
  on public.app_settings for update to authenticated
  using (true)
  with check (true);

-- Public logo bucket for CRM branding uploads
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'branding',
  'branding',
  true,
  2097152,
  array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'image/gif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "Authenticated users can upload branding assets"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'branding');

create policy "Authenticated users can update branding assets"
  on storage.objects for update to authenticated
  using (bucket_id = 'branding')
  with check (bucket_id = 'branding');

create policy "Authenticated users can delete branding assets"
  on storage.objects for delete to authenticated
  using (bucket_id = 'branding');

create policy "Public can read branding assets"
  on storage.objects for select
  using (bucket_id = 'branding');
