-- =====================================================================
-- App Caballos · Row Level Security
-- Regla general: un usuario logueado ve y edita solo lo de las escuelas
-- donde es miembro. El dueño del caballo NO tiene login: entra por link
-- con token y lee a través de carpeta_caballo() / liquidacion_publica().
-- service_role (n8n, Edge Functions, webhook de Mercado Pago) saltea RLS.
-- =====================================================================

alter table public.escuelas          enable row level security;
alter table public.miembros_escuela  enable row level security;
alter table public.duenos            enable row level security;
alter table public.caballos          enable row level security;
alter table public.servicios         enable row level security;
alter table public.reglas_alerta     enable row level security;
alter table public.liquidaciones     enable row level security;
alter table public.liquidacion_items enable row level security;
alter table public.pagos             enable row level security;

-- anon no toca tablas directamente
revoke all on all tables in schema public from anon;

-- Escuelas ------------------------------------------------------------
create policy escuelas_select on public.escuelas
  for select to authenticated using (public.es_miembro(id));
create policy escuelas_update on public.escuelas
  for update to authenticated using (public.es_admin(id)) with check (public.es_admin(id));
-- alta: solo vía crear_escuela()

-- Miembros ------------------------------------------------------------
create policy miembros_select on public.miembros_escuela
  for select to authenticated using (public.es_miembro(escuela_id));
create policy miembros_admin_insert on public.miembros_escuela
  for insert to authenticated with check (public.es_admin(escuela_id));
create policy miembros_admin_update on public.miembros_escuela
  for update to authenticated using (public.es_admin(escuela_id)) with check (public.es_admin(escuela_id));
create policy miembros_admin_delete on public.miembros_escuela
  for delete to authenticated using (public.es_admin(escuela_id));

-- Dueños, caballos, servicios: todo el staff ---------------------------
create policy duenos_staff on public.duenos
  for all to authenticated
  using (public.es_miembro(escuela_id)) with check (public.es_miembro(escuela_id));

create policy caballos_staff on public.caballos
  for all to authenticated
  using (public.es_miembro(escuela_id)) with check (public.es_miembro(escuela_id));

create policy servicios_staff on public.servicios
  for all to authenticated
  using (public.es_miembro(escuela_id)) with check (public.es_miembro(escuela_id));

-- Reglas de alerta: lee el staff, edita el admin -------------------------
create policy reglas_select on public.reglas_alerta
  for select to authenticated using (public.es_miembro(escuela_id));
create policy reglas_admin_write on public.reglas_alerta
  for all to authenticated
  using (public.es_admin(escuela_id)) with check (public.es_admin(escuela_id));

-- Liquidaciones ---------------------------------------------------------
create policy liquidaciones_select on public.liquidaciones
  for select to authenticated using (public.es_miembro(escuela_id));
create policy liquidaciones_insert on public.liquidaciones
  for insert to authenticated with check (public.es_miembro(escuela_id));
create policy liquidaciones_update on public.liquidaciones
  for update to authenticated
  using (public.es_miembro(escuela_id)) with check (public.es_miembro(escuela_id));
create policy liquidaciones_delete on public.liquidaciones
  for delete to authenticated
  using (public.es_admin(escuela_id) and estado = 'borrador');

create policy items_staff on public.liquidacion_items
  for all to authenticated
  using (public.es_miembro(escuela_id)) with check (public.es_miembro(escuela_id));

-- Pagos: el staff registra pagos manuales; los de Mercado Pago entran por
-- webhook con service_role. Corregir/anular: solo admin.
create policy pagos_select on public.pagos
  for select to authenticated using (public.es_miembro(escuela_id));
create policy pagos_insert on public.pagos
  for insert to authenticated
  with check (public.es_miembro(escuela_id) and metodo <> 'mercadopago');
create policy pagos_admin_update on public.pagos
  for update to authenticated
  using (public.es_admin(escuela_id)) with check (public.es_admin(escuela_id));
create policy pagos_admin_delete on public.pagos
  for delete to authenticated using (public.es_admin(escuela_id));

-- El token del caballo no se cambia desde el cliente salvo que se pida
-- regenerarlo explícitamente (ver regenerar_token_caballo).
create or replace function public.regenerar_token_caballo(p_caballo uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token text := public.nuevo_token();
  v_escuela uuid;
begin
  select escuela_id into v_escuela from public.caballos where id = p_caballo;
  perform public.exigir_miembro(v_escuela);
  update public.caballos set token_publico = v_token where id = p_caballo;
  return v_token;
end;
$$;
revoke execute on function public.regenerar_token_caballo(uuid) from public, anon;
grant execute on function public.regenerar_token_caballo(uuid) to authenticated;
