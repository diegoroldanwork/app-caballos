-- =====================================================================
-- App Caballos · Funciones de negocio
-- =====================================================================

-- ---------------------------------------------------------------------
-- Helpers de permisos (security definer para no recursar en RLS)
-- ---------------------------------------------------------------------
create or replace function public.es_miembro(p_escuela uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.miembros_escuela
    where escuela_id = p_escuela and user_id = auth.uid()
  );
$$;

create or replace function public.es_admin(p_escuela uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.miembros_escuela
    where escuela_id = p_escuela and user_id = auth.uid() and rol = 'admin'
  );
$$;

-- Permite la llamada si es miembro de la escuela o si viene con service_role
-- (n8n, Edge Functions, cron).
create or replace function public.exigir_miembro(p_escuela uuid)
returns void
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if coalesce(auth.role(), '') = 'service_role' then
    return;
  end if;
  if not public.es_miembro(p_escuela) then
    raise exception 'No tenés acceso a esta escuela' using errcode = '42501';
  end if;
end;
$$;

-- ---------------------------------------------------------------------
-- Alta de escuela: crea la escuela, te hace admin y carga reglas por defecto
-- ---------------------------------------------------------------------
create or replace function public.crear_escuela(p_nombre text, p_localidad text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Tenés que iniciar sesión' using errcode = '42501';
  end if;

  insert into public.escuelas (nombre, localidad)
  values (p_nombre, p_localidad)
  returning id into v_id;

  insert into public.miembros_escuela (escuela_id, user_id, rol)
  values (v_id, auth.uid(), 'admin');

  perform public.cargar_reglas_default(v_id);
  return v_id;
end;
$$;

-- Valores de referencia; cada escuela los ajusta a su criterio veterinario.
create or replace function public.cargar_reglas_default(p_escuela uuid)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.reglas_alerta (escuela_id, tipo, dias_validez, dias_aviso) values
    (p_escuela, 'aie',             60, 10),  -- certificado AIE para traslados
    (p_escuela, 'vacuna',         180, 15),  -- influenza equina, semestral
    (p_escuela, 'herraje',         45,  7),
    (p_escuela, 'desparasitacion', 90, 10),
    (p_escuela, 'odontologia',    365, 30)
  on conflict do nothing;
$$;

-- ---------------------------------------------------------------------
-- Alertas sanitarias: último servicio de cada tipo con regla, por caballo
-- security_invoker => respeta el RLS de quien consulta
-- ---------------------------------------------------------------------
create or replace view public.alertas_sanitarias
with (security_invoker = true)
as
select
  c.escuela_id,
  c.id            as caballo_id,
  c.nombre        as caballo,
  c.dueno_id,
  r.tipo,
  u.fecha         as ultima_fecha,
  coalesce(u.vence_el, u.fecha + r.dias_validez) as vence_el,
  case
    when u.id is null then 'sin_registro'
    when coalesce(u.vence_el, u.fecha + r.dias_validez) < current_date then 'vencido'
    when coalesce(u.vence_el, u.fecha + r.dias_validez) <= current_date + r.dias_aviso then 'por_vencer'
    else 'al_dia'
  end as estado,
  coalesce(u.vence_el, u.fecha + r.dias_validez) - current_date as dias_restantes
from public.caballos c
join public.reglas_alerta r on r.escuela_id = c.escuela_id
left join lateral (
  select s.id, s.fecha, s.vence_el
  from public.servicios s
  where s.caballo_id = c.id and s.tipo = r.tipo
  order by s.fecha desc, s.created_at desc
  limit 1
) u on true
where c.activo;

-- ---------------------------------------------------------------------
-- Liquidación mensual
-- Para cada dueño con caballos activos: pensión del mes + todos los
-- extras facturables aún no liquidados con fecha hasta fin de mes
-- (así no se pierde un herraje cargado tarde).
-- Si la liquidación del dueño ya existe en 'borrador', se rehace.
-- Si ya fue emitida/pagada, no se toca.
-- ---------------------------------------------------------------------
create or replace function public.generar_liquidaciones(p_escuela uuid, p_periodo date)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_periodo date := date_trunc('month', p_periodo)::date;
  v_fin     date := (date_trunc('month', p_periodo) + interval '1 month')::date;
  v_dueno   record;
  v_liq     uuid;
  v_count   integer := 0;
begin
  perform public.exigir_miembro(p_escuela);

  for v_dueno in
    select d.id
    from public.duenos d
    where d.escuela_id = p_escuela
      and (
        exists (select 1 from public.caballos c
                where c.dueno_id = d.id and c.activo and c.cuota_pension > 0)
        or exists (select 1 from public.servicios s
                   join public.caballos c on c.id = s.caballo_id
                   where c.dueno_id = d.id and s.facturable
                     and s.liquidacion_id is null and s.fecha < v_fin)
      )
  loop
    select id into v_liq
    from public.liquidaciones
    where escuela_id = p_escuela and dueno_id = v_dueno.id and periodo = v_periodo;

    if v_liq is null then
      insert into public.liquidaciones (escuela_id, dueno_id, periodo)
      values (p_escuela, v_dueno.id, v_periodo)
      returning id into v_liq;
    elsif (select estado from public.liquidaciones where id = v_liq) <> 'borrador' then
      continue;
    else
      update public.servicios set liquidacion_id = null where liquidacion_id = v_liq;
      delete from public.liquidacion_items where liquidacion_id = v_liq and tipo <> 'ajuste';
    end if;

    -- Pensión
    insert into public.liquidacion_items (liquidacion_id, escuela_id, caballo_id, tipo, concepto, monto)
    select v_liq, p_escuela, c.id, 'pension',
           'Pensión ' || to_char(v_periodo, 'MM/YYYY') || ' · ' || c.nombre,
           c.cuota_pension
    from public.caballos c
    where c.dueno_id = v_dueno.id and c.activo and c.cuota_pension > 0;

    -- Extras
    with extras as (
      update public.servicios s
      set liquidacion_id = v_liq
      from public.caballos c
      where c.id = s.caballo_id
        and c.dueno_id = v_dueno.id
        and s.facturable
        and s.liquidacion_id is null
        and s.fecha < v_fin
      returning s.id, s.caballo_id, s.tipo, s.fecha, s.descripcion, s.costo, c.nombre as caballo
    )
    insert into public.liquidacion_items (liquidacion_id, escuela_id, caballo_id, servicio_id, tipo, concepto, monto)
    select v_liq, p_escuela, e.caballo_id, e.id, 'extra',
           initcap(replace(e.tipo::text, '_', ' ')) || ' ' || to_char(e.fecha, 'DD/MM')
             || ' · ' || e.caballo || coalesce(' · ' || e.descripcion, ''),
           e.costo
    from extras e
    where e.costo > 0;

    perform public.recalcular_liquidacion(v_liq);
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

create or replace function public.recalcular_liquidacion(p_liquidacion uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total  numeric(12,2);
  v_pagado numeric(12,2);
begin
  select coalesce(sum(monto), 0) into v_total
  from public.liquidacion_items where liquidacion_id = p_liquidacion;

  select coalesce(sum(monto), 0) into v_pagado
  from public.pagos where liquidacion_id = p_liquidacion and estado = 'aprobado';

  update public.liquidaciones l
  set total  = v_total,
      pagado = v_pagado,
      estado = case
        when l.estado in ('emitida', 'vencida') and v_pagado >= v_total and v_total > 0
          then 'pagada'::public.estado_liquidacion
        when l.estado = 'pagada' and v_pagado < v_total then
          case when l.fecha_vencimiento < current_date
               then 'vencida'::public.estado_liquidacion
               else 'emitida'::public.estado_liquidacion end
        else l.estado
      end
  where l.id = p_liquidacion;
end;
$$;

-- Emitir: congela la liquidación y fija el vencimiento (día configurado del mes siguiente)
create or replace function public.emitir_liquidacion(p_liquidacion uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_liq public.liquidaciones;
  v_dia smallint;
begin
  select * into v_liq from public.liquidaciones where id = p_liquidacion;
  if not found then
    raise exception 'Liquidación inexistente';
  end if;
  perform public.exigir_miembro(v_liq.escuela_id);

  if v_liq.estado <> 'borrador' then
    raise exception 'Solo se puede emitir una liquidación en borrador';
  end if;

  select dia_vencimiento into v_dia from public.escuelas where id = v_liq.escuela_id;

  update public.liquidaciones
  set estado = 'emitida',
      fecha_emision = current_date,
      fecha_vencimiento = (v_liq.periodo + interval '1 month')::date + (v_dia - 1)
  where id = p_liquidacion;

  perform public.recalcular_liquidacion(p_liquidacion);
end;
$$;

-- Para el cron diario (n8n con service_role)
create or replace function public.marcar_vencidas()
returns integer
language sql
security definer
set search_path = public
as $$
  with u as (
    update public.liquidaciones
    set estado = 'vencida'
    where estado = 'emitida' and fecha_vencimiento < current_date
    returning 1
  )
  select count(*)::integer from u;
$$;

-- Cada cambio en pagos recalcula la liquidación
create or replace function public.tg_pagos_recalcular()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.recalcular_liquidacion(coalesce(new.liquidacion_id, old.liquidacion_id));
  return null;
end;
$$;

create trigger pagos_recalcular
after insert or update or delete on public.pagos
for each row execute function public.tg_pagos_recalcular();

-- Cada cambio en ítems recalcula el total
create or replace function public.tg_items_recalcular()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.recalcular_liquidacion(coalesce(new.liquidacion_id, old.liquidacion_id));
  return null;
end;
$$;

create trigger items_recalcular
after insert or update or delete on public.liquidacion_items
for each row execute function public.tg_items_recalcular();

-- No se pueden tocar ítems de una liquidación ya emitida
create or replace function public.tg_items_solo_borrador()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_estado public.estado_liquidacion;
begin
  select estado into v_estado from public.liquidaciones
  where id = coalesce(new.liquidacion_id, old.liquidacion_id);
  if v_estado is not null and v_estado <> 'borrador' then
    raise exception 'La liquidación ya fue emitida; agregá un ajuste en la del mes siguiente';
  end if;
  return coalesce(new, old);
end;
$$;

create trigger items_solo_borrador
before insert or update or delete on public.liquidacion_items
for each row execute function public.tg_items_solo_borrador();

-- ---------------------------------------------------------------------
-- Acceso del dueño por link (sin login). Rol anon.
-- Solo devuelven lo que corresponde al token; las tablas no se exponen.
-- ---------------------------------------------------------------------
create or replace function public.carpeta_caballo(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_c public.caballos;
begin
  select * into v_c from public.caballos where token_publico = p_token;
  if not found then
    return null;
  end if;

  return jsonb_build_object(
    'caballo', jsonb_build_object(
      'nombre', v_c.nombre, 'raza', v_c.raza, 'pelaje', v_c.pelaje,
      'sexo', v_c.sexo, 'fecha_nacimiento', v_c.fecha_nacimiento,
      'microchip', v_c.microchip, 'foto_path', v_c.foto_path
    ),
    'escuela', (select jsonb_build_object('nombre', e.nombre, 'telefono', e.telefono, 'localidad', e.localidad)
                from public.escuelas e where e.id = v_c.escuela_id),
    'dueno', (select d.nombre from public.duenos d where d.id = v_c.dueno_id),
    'servicios', coalesce((
      select jsonb_agg(jsonb_build_object(
               'fecha', s.fecha, 'tipo', s.tipo, 'descripcion', s.descripcion,
               'profesional', s.profesional, 'costo', s.costo, 'foto_path', s.foto_path)
             order by s.fecha desc, s.created_at desc)
      from public.servicios s where s.caballo_id = v_c.id), '[]'::jsonb),
    'alertas', coalesce((
      select jsonb_agg(jsonb_build_object(
               'tipo', a.tipo, 'ultima_fecha', a.ultima_fecha, 'vence_el', a.vence_el,
               'estado', a.estado, 'dias_restantes', a.dias_restantes)
             order by a.vence_el nulls first)
      from public.alertas_sanitarias a where a.caballo_id = v_c.id), '[]'::jsonb),
    'liquidaciones', coalesce((
      select jsonb_agg(jsonb_build_object(
               'periodo', l.periodo, 'estado', l.estado, 'total', l.total,
               'pagado', l.pagado, 'vence_el', l.fecha_vencimiento, 'token', l.token_publico)
             order by l.periodo desc)
      from (select * from public.liquidaciones
            where dueno_id = v_c.dueno_id and estado <> 'borrador' and estado <> 'anulada'
            order by periodo desc limit 12) l), '[]'::jsonb)
  );
end;
$$;

create or replace function public.liquidacion_publica(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_l public.liquidaciones;
begin
  select * into v_l from public.liquidaciones
  where token_publico = p_token and estado not in ('borrador', 'anulada');
  if not found then
    return null;
  end if;

  return jsonb_build_object(
    'escuela', (select jsonb_build_object('nombre', e.nombre, 'telefono', e.telefono, 'mp_alias', e.mp_alias)
                from public.escuelas e where e.id = v_l.escuela_id),
    'dueno', (select d.nombre from public.duenos d where d.id = v_l.dueno_id),
    'periodo', v_l.periodo,
    'estado', v_l.estado,
    'total', v_l.total,
    'pagado', v_l.pagado,
    'saldo', v_l.total - v_l.pagado,
    'vence_el', v_l.fecha_vencimiento,
    'mp_init_point', v_l.mp_init_point,
    'items', coalesce((
      select jsonb_agg(jsonb_build_object('tipo', i.tipo, 'concepto', i.concepto, 'monto', i.monto)
                       order by i.tipo, i.concepto)
      from public.liquidacion_items i where i.liquidacion_id = v_l.id), '[]'::jsonb)
  );
end;
$$;

-- ---------------------------------------------------------------------
-- Permisos de ejecución
-- ---------------------------------------------------------------------
revoke execute on all functions in schema public from public, anon, authenticated;

grant execute on function public.carpeta_caballo(text)      to anon, authenticated;
grant execute on function public.liquidacion_publica(text)  to anon, authenticated;

grant execute on function public.es_miembro(uuid)                    to authenticated;
grant execute on function public.es_admin(uuid)                      to authenticated;
grant execute on function public.crear_escuela(text, text)           to authenticated;
grant execute on function public.generar_liquidaciones(uuid, date)   to authenticated, service_role;
grant execute on function public.emitir_liquidacion(uuid)            to authenticated, service_role;
grant execute on function public.marcar_vencidas()                   to service_role;
grant execute on function public.nuevo_token()                       to authenticated, service_role;
