-- =====================================================================
-- App Caballos · Cobro con Mercado Pago
--
-- Flujo real (Checkout Pro):
--   1. Al emitir, una Edge Function/n8n crea la preferencia en MP con
--      external_reference = liquidaciones.id y guarda mp_preference_id
--      y mp_init_point.
--   2. El webhook de MP llama a registrar_pago_mp() con service_role.
--
-- Flujo demo: el botón "Pagar" de la liquidación pública llama a
-- simular_pago_mp(token) y la liquidación queda pagada.
-- ⚠️ Antes de producción: borrar simular_pago_mp (ver al final).
-- =====================================================================

-- Idempotente por mp_payment_id: MP reenvía webhooks.
create or replace function public.registrar_pago_mp(
  p_liquidacion uuid,
  p_mp_payment_id text,
  p_estado public.estado_pago,
  p_monto numeric,
  p_detalle jsonb default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_escuela uuid;
  v_id uuid;
begin
  select escuela_id into v_escuela from public.liquidaciones where id = p_liquidacion;
  if v_escuela is null then
    raise exception 'Liquidación inexistente: %', p_liquidacion;
  end if;

  insert into public.pagos (escuela_id, liquidacion_id, metodo, estado, monto, mp_payment_id, pagado_el, detalle)
  values (v_escuela, p_liquidacion, 'mercadopago', p_estado, p_monto, p_mp_payment_id,
          case when p_estado = 'aprobado' then now() end, p_detalle)
  on conflict (mp_payment_id) do update
    set estado    = excluded.estado,
        monto     = excluded.monto,
        pagado_el = coalesce(public.pagos.pagado_el, excluded.pagado_el),
        detalle   = excluded.detalle
  returning id into v_id;

  return v_id;
end;
$$;
revoke execute on function public.registrar_pago_mp(uuid, text, public.estado_pago, numeric, jsonb) from public, anon, authenticated;
grant execute on function public.registrar_pago_mp(uuid, text, public.estado_pago, numeric, jsonb) to service_role;

-- ---------------------------------------------------------------------
-- SOLO DEMO: paga el saldo de una liquidación emitida a partir de su token
-- ---------------------------------------------------------------------
create or replace function public.simular_pago_mp(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_l public.liquidaciones;
begin
  select * into v_l from public.liquidaciones
  where token_publico = p_token and estado in ('emitida', 'vencida');
  if not found then
    raise exception 'No hay saldo pendiente para este link';
  end if;

  perform public.registrar_pago_mp(
    v_l.id,
    'SIM-' || replace(gen_random_uuid()::text, '-', ''),
    'aprobado',
    v_l.total - v_l.pagado,
    jsonb_build_object('simulado', true)
  );

  return public.liquidacion_publica(p_token);
end;
$$;
revoke execute on function public.simular_pago_mp(text) from public;
grant execute on function public.simular_pago_mp(text) to anon, authenticated;

-- Para producción:
-- drop function public.simular_pago_mp(text);
