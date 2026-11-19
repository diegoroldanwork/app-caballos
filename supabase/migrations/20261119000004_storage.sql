-- =====================================================================
-- App Caballos · Fotos (Supabase Storage)
-- Bucket "fotos". Ruta: {escuela_id}/{caballo_id}/{uuid}.jpg
-- Lectura pública por URL (las rutas llevan UUIDs, no se pueden listar),
-- así la carpeta del dueño muestra las fotos sin login.
-- Escritura y borrado: solo miembros de la escuela de esa carpeta.
-- Para producción conviene pasar a bucket privado + URLs firmadas
-- generadas por una Edge Function que valide el token del caballo.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos', 'fotos', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/heic'])
on conflict (id) do nothing;

create or replace function public.escuela_de_ruta(p_name text)
returns uuid
language sql
immutable
set search_path = ''
as $$
  select case
    when split_part(p_name, '/', 1) ~ '^[0-9a-f-]{36}$' then split_part(p_name, '/', 1)::uuid
  end;
$$;
grant execute on function public.escuela_de_ruta(text) to authenticated;

create policy fotos_staff_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'fotos' and public.es_miembro(public.escuela_de_ruta(name)));

create policy fotos_staff_update on storage.objects
  for update to authenticated
  using (bucket_id = 'fotos' and public.es_miembro(public.escuela_de_ruta(name)))
  with check (bucket_id = 'fotos' and public.es_miembro(public.escuela_de_ruta(name)));

create policy fotos_staff_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'fotos' and public.es_miembro(public.escuela_de_ruta(name)));

create policy fotos_staff_select on storage.objects
  for select to authenticated
  using (bucket_id = 'fotos' and public.es_miembro(public.escuela_de_ruta(name)));
