-- =====================================================================
-- Querencia · Reiniciar la demo
-- Borra la escuela de demo y la vuelve a cargar de cero (con fechas de hoy),
-- para grabar el video otra vez después de haber pagado o cargado cosas.
-- Pegar entero en Supabase → SQL Editor → Run.
-- El usuario demo@losaromos.com.ar no se borra; se vuelve a asociar al final.
-- =====================================================================
delete from public.escuelas where id = 'a0000000-0000-4000-8000-000000000001';

-- =====================================================================
-- App Caballos · Seed de demo
-- Escuela ficticia "Escuela Ecuestre Los Aromos" con 4 dueños y 6 caballos.
-- Las fechas son relativas al día en que se corre el seed, así la demo
-- siempre muestra alertas y cobros "de este mes".
--   · hace 2 meses: liquidación emitida y pagada por todos
--   · mes pasado:   emitida; uno pagó por MP, uno en efectivo,
--                   uno pagó la mitad y uno debe todo (vencida)
--   · este mes:     servicios cargados, todavía sin liquidar
-- =====================================================================

-- El seed corre como postgres; las funciones de negocio piden miembro o
-- service_role, así que nos presentamos como service_role.
select set_config('request.jwt.claims', '{"role":"service_role"}', false);

-- Escuela -------------------------------------------------------------
insert into public.escuelas (id, nombre, cuit, localidad, telefono, email, mp_alias, dia_vencimiento)
values ('a0000000-0000-4000-8000-000000000001',
        'Escuela Ecuestre Los Aromos', '30-71234567-9', 'Cañuelas, Buenos Aires',
        '+5491155550100', 'administracion@losaromos.example', 'LOS.AROMOS.MP', 10);

select public.cargar_reglas_default('a0000000-0000-4000-8000-000000000001');

-- Dueños --------------------------------------------------------------
insert into public.duenos (id, escuela_id, nombre, dni_cuit, email, telefono) values
  ('d0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001',
   'Martina Fernández', '32.456.789', 'martina.fernandez@example.com', '+5491155550111'),
  ('d0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001',
   'Joaquín Ríos', '28.987.654', 'joaquin.rios@example.com', '+5491155550122'),
  ('d0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001',
   'Lucía Sosa', '35.111.222', 'lucia.sosa@example.com', '+5491155550133'),
  ('d0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000001',
   'Tomás Aguirre', '30.333.444', 'tomas.aguirre@example.com', '+5491155550144');

-- Caballos ------------------------------------------------------------
-- token_publico fijo para que los links de la demo no cambien al resetear
insert into public.caballos
  (id, escuela_id, dueno_id, nombre, raza, pelaje, sexo, fecha_nacimiento, microchip, cuota_pension, token_publico)
values
  ('c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001',
   'Lucero',  'Criollo',          'Tordillo', 'castrado', '2015-10-02', '032000000000101', 480000, 'demo-lucero'),
  ('c0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001',
   'Morena',  'Silla Argentino',  'Zaino',    'hembra',   '2017-09-14', '032000000000102', 520000, 'demo-morena'),
  ('c0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000002',
   'Pampa',   'Criollo',          'Bayo',     'hembra',   '2013-11-20', '032000000000103', 480000, 'demo-pampa'),
  ('c0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000003',
   'Rayo',    'Polo Argentino',   'Alazán',   'castrado', '2016-08-05', '032000000000104', 520000, 'demo-rayo'),
  ('c0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000003',
   'Duquesa', 'Árabe',            'Tordillo', 'hembra',   '2012-12-01', null,              480000, 'demo-duquesa'),
  ('c0000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000004',
   'Tango',   'Polo Argentino',   'Colorado', 'castrado', '2018-10-10', '032000000000106', 480000, 'demo-tango');

-- Servicios -------------------------------------------------------------
-- (caballo, tipo, hace_n_dias, descripción, profesional, costo, facturable)
insert into public.servicios (escuela_id, caballo_id, tipo, fecha, descripcion, profesional, costo, facturable)
select 'a0000000-0000-4000-8000-000000000001', s.caballo::uuid, s.tipo::public.tipo_servicio,
       current_date - s.dias, s.descripcion, s.profesional, s.costo, s.facturable
from (values
  -- Lucero
  ('c0000000-0000-4000-8000-000000000001', 'herraje',          95, 'Herraje completo, 4 patas',        'Herrador Ramón Benítez', 65000, true),
  ('c0000000-0000-4000-8000-000000000001', 'vacuna',           170, 'Influenza equina (refuerzo)',      'Vet. Carolina Méndez',   28000, true),
  ('c0000000-0000-4000-8000-000000000001', 'aie',              52, 'Extracción para AIE. Negativo',    'Vet. Carolina Méndez',   32000, true),
  ('c0000000-0000-4000-8000-000000000001', 'herraje',          40, 'Herraje completo, 4 patas',        'Herrador Ramón Benítez', 65000, true),
  -- Morena
  ('c0000000-0000-4000-8000-000000000002', 'veterinario',      75, 'Revisión por renguera MAD. Reposo 7 días, antiinflamatorio', 'Vet. Carolina Méndez', 55000, true),
  ('c0000000-0000-4000-8000-000000000002', 'herraje',          30, 'Herraje correctivo manos',         'Herrador Ramón Benítez', 85000, true),
  ('c0000000-0000-4000-8000-000000000002', 'vacuna',           60, 'Influenza equina',                 'Vet. Carolina Méndez',   28000, true),
  ('c0000000-0000-4000-8000-000000000002', 'aie',              20, 'Extracción para AIE. Negativo',    'Vet. Carolina Méndez',   32000, true),
  -- Pampa
  ('c0000000-0000-4000-8000-000000000003', 'desparasitacion',  85, 'Ivermectina oral',                 'Personal de la escuela', 12000, true),
  ('c0000000-0000-4000-8000-000000000003', 'herraje',          50, 'Desvasado y herraje de manos',     'Herrador Ramón Benítez', 45000, true),
  ('c0000000-0000-4000-8000-000000000003', 'vacuna',           100, 'Influenza equina',                'Vet. Carolina Méndez',   28000, true),
  ('c0000000-0000-4000-8000-000000000003', 'aie',              70, 'Extracción para AIE. Negativo',    'Vet. Carolina Méndez',   32000, true),
  -- Rayo
  ('c0000000-0000-4000-8000-000000000004', 'herraje',          12, 'Herraje completo para temporada de polo', 'Herrador Ramón Benítez', 70000, true),
  ('c0000000-0000-4000-8000-000000000004', 'odontologia',      45, 'Limado de dientes',                'Vet. Pablo Ortiz (odontología)', 60000, true),
  ('c0000000-0000-4000-8000-000000000004', 'vacuna',           176, 'Influenza equina',                'Vet. Carolina Méndez',   28000, true),
  ('c0000000-0000-4000-8000-000000000004', 'aie',              15, 'Extracción para AIE. Negativo',    'Vet. Carolina Méndez',   32000, true),
  -- Duquesa (sin microchip: dispara el aviso de Res. 831/2026)
  ('c0000000-0000-4000-8000-000000000005', 'veterinario',      8,  'Cólico leve. Control y suero',     'Vet. Carolina Méndez',   90000, true),
  ('c0000000-0000-4000-8000-000000000005', 'herraje',          60, 'Desvasado (anda descalza)',        'Herrador Ramón Benítez', 25000, true),
  ('c0000000-0000-4000-8000-000000000005', 'vacuna',           200, 'Influenza equina',                'Vet. Carolina Méndez',   28000, true),
  -- Tango
  ('c0000000-0000-4000-8000-000000000006', 'herraje',          5,  'Herraje completo, 4 patas',        'Herrador Ramón Benítez', 65000, true),
  ('c0000000-0000-4000-8000-000000000006', 'vacuna',           35, 'Influenza equina',                 'Vet. Carolina Méndez',   28000, true),
  ('c0000000-0000-4000-8000-000000000006', 'aie',              35, 'Extracción para AIE. Negativo',    'Vet. Carolina Méndez',   32000, true),
  -- Desparasitación general del plantel (Duquesa quedó afuera)
  ('c0000000-0000-4000-8000-000000000001', 'desparasitacion',  28, 'Ivermectina oral, plan general', 'Personal de la escuela', 12000, true),
  ('c0000000-0000-4000-8000-000000000002', 'desparasitacion',  28, 'Ivermectina oral, plan general', 'Personal de la escuela', 12000, true),
  ('c0000000-0000-4000-8000-000000000004', 'desparasitacion',  28, 'Ivermectina oral, plan general', 'Personal de la escuela', 12000, true),
  ('c0000000-0000-4000-8000-000000000006', 'desparasitacion',  28, 'Ivermectina oral, plan general', 'Personal de la escuela', 12000, true),
  ('c0000000-0000-4000-8000-000000000006', 'otro',             3,  'Manta de invierno a cargo de la escuela', 'Personal de la escuela', 0, false)
) as s(caballo, tipo, dias, descripcion, profesional, costo, facturable);

-- Liquidaciones -----------------------------------------------------------
-- Hace 2 meses: generar, emitir y pagar todo
select public.generar_liquidaciones('a0000000-0000-4000-8000-000000000001',
                                    (date_trunc('month', current_date) - interval '2 months')::date);
select public.emitir_liquidacion(id) from public.liquidaciones
where periodo = (date_trunc('month', current_date) - interval '2 months')::date;

-- Mes pasado
select public.generar_liquidaciones('a0000000-0000-4000-8000-000000000001',
                                    (date_trunc('month', current_date) - interval '1 month')::date);
select public.emitir_liquidacion(id) from public.liquidaciones
where periodo = (date_trunc('month', current_date) - interval '1 month')::date;

-- Fechas de emisión/vencimiento realistas: se emite el 1° del mes siguiente
update public.liquidaciones
set fecha_emision     = (periodo + interval '1 month')::date,
    fecha_vencimiento = (periodo + interval '1 month')::date + 9;

-- Tokens fijos para la demo: liq-<dueño>-<hace n meses>
update public.liquidaciones l
set token_publico = 'liq-' || translate(split_part(lower(d.nombre), ' ', 1), 'áéíóú', 'aeiou') || '-'
                    || (extract(month from age(date_trunc('month', current_date), l.periodo)))::int
from public.duenos d
where d.id = l.dueno_id;

-- Pagos de hace 2 meses: todos pagaron
insert into public.pagos (escuela_id, liquidacion_id, metodo, estado, monto, mp_payment_id, pagado_el)
select l.escuela_id, l.id,
       case when d.nombre like 'Joaquín%' then 'efectivo' else 'mercadopago' end::public.metodo_pago,
       'aprobado', l.total,
       case when d.nombre like 'Joaquín%' then null else 'SIM-SEED-' || left(l.id::text, 8) end,
       l.fecha_emision + 5
from public.liquidaciones l join public.duenos d on d.id = l.dueno_id
where l.periodo = (date_trunc('month', current_date) - interval '2 months')::date;

-- Pagos del mes pasado: Martina por MP, Joaquín en efectivo, Tomás la mitad por
-- transferencia, Lucía no pagó.
insert into public.pagos (escuela_id, liquidacion_id, metodo, estado, monto, mp_payment_id, pagado_el)
select l.escuela_id, l.id, p.metodo::public.metodo_pago, 'aprobado',
       round(l.total * p.fraccion, 2),
       case when p.metodo = 'mercadopago' then 'SIM-SEED-' || left(l.id::text, 8) end,
       l.fecha_emision + p.dia
from public.liquidaciones l
join public.duenos d on d.id = l.dueno_id
join (values
  ('d0000000-0000-4000-8000-000000000001', 'mercadopago',   1.0, 3),
  ('d0000000-0000-4000-8000-000000000002', 'efectivo',      1.0, 8),
  ('d0000000-0000-4000-8000-000000000004', 'transferencia', 0.5, 6)
) as p(dueno, metodo, fraccion, dia) on p.dueno::uuid = d.id
where l.periodo = (date_trunc('month', current_date) - interval '1 month')::date;

-- Lo que venció sin pagar queda "vencida"
select public.marcar_vencidas();

select set_config('request.jwt.claims', '', false);

-- ---------------------------------------------------------------------
-- Usuario de la escuela para la demo:
-- 1. Crealo en Authentication → Users (ej. demo@losaromos.example).
-- 2. Corré esto en el SQL Editor reemplazando el email:
--
-- insert into public.miembros_escuela (escuela_id, user_id, rol)
-- select 'a0000000-0000-4000-8000-000000000001', id, 'admin'
-- from auth.users where email = 'demo@losaromos.example';
-- ---------------------------------------------------------------------

-- Volver a asociar el usuario de la demo
insert into public.miembros_escuela (escuela_id, user_id, rol)
select 'a0000000-0000-4000-8000-000000000001', id, 'admin'
from auth.users where email = 'demo@losaromos.com.ar'
on conflict do nothing;
-- Datos de demo: alumnos de Los Aromos y visitas agendadas (fechas relativas a hoy)
insert into public.alumnos (id, escuela_id, nombre, telefono) values
  ('e0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'Sofía Paz',       '+5491155550201'),
  ('e0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'Benjamín Ortiz',  '+5491155550202'),
  ('e0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 'Valentina Rey',   '+5491155550203'),
  ('e0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000001', 'Lucas Ferrari',   '+5491155550204'),
  ('e0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000001', 'Camila Díaz',     '+5491155550205')
on conflict do nothing;

with m as (select date_trunc('month', current_date)::date as este, (date_trunc('month', current_date) - interval '1 month')::date as pasado)
insert into public.cobros_alumnos (escuela_id, alumno_id, periodo, concepto, monto, pagado, vence_el)
select 'a0000000-0000-4000-8000-000000000001', x.alumno::uuid, x.periodo, x.concepto, x.monto, x.pagado, x.periodo + 9
from m, lateral (values
  ('e0000000-0000-4000-8000-000000000001', m.pasado, 'Abono 8 clases',                       160000, 160000),
  ('e0000000-0000-4000-8000-000000000002', m.pasado, 'Abono 8 clases',                       160000,      0),
  ('e0000000-0000-4000-8000-000000000004', m.pasado, '2 clases sueltas + alquiler de caballo', 85000,  40000),
  ('e0000000-0000-4000-8000-000000000005', m.pasado, 'Abono 4 clases',                        90000,  90000),
  ('e0000000-0000-4000-8000-000000000001', m.este,   'Abono 8 clases',                       160000, 160000),
  ('e0000000-0000-4000-8000-000000000002', m.este,   'Abono 8 clases',                       160000,      0),
  ('e0000000-0000-4000-8000-000000000003', m.este,   'Abono 4 clases',                        90000,      0),
  ('e0000000-0000-4000-8000-000000000005', m.este,   'Abono 4 clases',                        90000,      0)
) as x(alumno, periodo, concepto, monto, pagado);

insert into public.visitas (escuela_id, tipo, fecha, hora, profesional, nota) values
  ('a0000000-0000-4000-8000-000000000001', 'herrero',     current_date + 3,  '09:00', 'Herrador Raúl Medina',  'Lucero, Pampa y Duquesa'),
  ('a0000000-0000-4000-8000-000000000001', 'veterinario', current_date + 6,  '10:30', 'Vet. Carolina Méndez',  'Vacunas y extracción para AIE'),
  ('a0000000-0000-4000-8000-000000000001', 'odontologo',  current_date + 24, '15:00', 'Odont. equino Martín Sosa', 'Revisión general');
