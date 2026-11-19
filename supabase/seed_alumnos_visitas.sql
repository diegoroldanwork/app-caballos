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
