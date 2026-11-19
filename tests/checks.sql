\pset pager off
select d.nombre, l.periodo, l.estado, l.total, l.pagado, l.token_publico, l.fecha_vencimiento
from liquidaciones l join duenos d on d.id=l.dueno_id order by periodo, nombre;
select count(*) filter (where liquidacion_id is null and facturable) sin_liquidar, count(*) total from servicios;
select caballo, tipo, ultima_fecha, vence_el, estado, dias_restantes from alertas_sanitarias where estado<>'al_dia' order by caballo, tipo;
-- anon
set role anon; set request.jwt.claims='{"role":"anon"}';
select jsonb_pretty(carpeta_caballo('demo-morena')) is not null as carpeta_ok;
select carpeta_caballo('nope') as carpeta_mala;
select (liquidacion_publica('liq-lucia-1'))->>'saldo' saldo_lucia;
select (simular_pago_mp('liq-lucia-1'))->>'estado' tras_pago;
\set ON_ERROR_STOP 0
select count(*) from caballos;
select generar_liquidaciones('a0000000-0000-4000-8000-000000000001', current_date);
reset role;
-- authenticated sin escuela, y otro con escuela
insert into auth.users(id,email) values ('11111111-1111-4111-8111-111111111111','staff@x'),('22222222-2222-4222-8222-222222222222','otro@x');
insert into miembros_escuela values ('a0000000-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111111','staff');
set role authenticated; set request.jwt.claims='{"role":"authenticated","sub":"22222222-2222-4222-8222-222222222222"}';
select 'otro ve caballos:' x, count(*) from caballos;
select generar_liquidaciones('a0000000-0000-4000-8000-000000000001', current_date);
select crear_escuela('Club Otro') is not null as crea_escuela;
select 'otro ve escuelas:' x, count(*) from escuelas;
insert into duenos (escuela_id,nombre) values ('a0000000-0000-4000-8000-000000000001','intruso');
set request.jwt.claims='{"role":"authenticated","sub":"11111111-1111-4111-8111-111111111111"}';
select 'staff ve caballos:' x, count(*) from caballos;
insert into servicios (escuela_id,caballo_id,tipo,costo,descripcion) values ('a0000000-0000-4000-8000-000000000001','c0000000-0000-4000-8000-000000000003','veterinario',40000,'test') returning created_by;
select generar_liquidaciones('a0000000-0000-4000-8000-000000000001', current_date) as liq_mes_actual;
select estado,total from liquidaciones where periodo=date_trunc('month',current_date)::date order by total;
insert into liquidacion_items(liquidacion_id,escuela_id,tipo,concepto,monto) select id,escuela_id,'ajuste','x',1 from liquidaciones where estado='pagada' limit 1;
insert into pagos(escuela_id,liquidacion_id,metodo,estado,monto) select escuela_id,id,'mercadopago','aprobado',1 from liquidaciones limit 1;
select marcar_vencidas();
insert into storage.objects(bucket_id,name) values ('fotos','a0000000-0000-4000-8000-000000000001/c/x.jpg');
insert into storage.objects(bucket_id,name) values ('fotos','b0000000-0000-4000-8000-000000000001/c/x.jpg');
