-- =====================================================================
-- Querencia · Alumnos (cobros de clases) y visitas agendadas
-- =====================================================================

-- Alumnos de la escuela (no necesariamente tienen caballo)
create table public.alumnos (
  id          uuid primary key default gen_random_uuid(),
  escuela_id  uuid not null references public.escuelas(id) on delete cascade,
  nombre      text not null,
  telefono    text,
  email       text,
  activo      boolean not null default true,
  created_at  timestamptz not null default now(),
  unique (escuela_id, id)
);
create index on public.alumnos (escuela_id);

-- Lo que debe cada alumno: abono de clases, clase suelta, alquiler de caballo...
create table public.cobros_alumnos (
  id          uuid primary key default gen_random_uuid(),
  escuela_id  uuid not null,
  alumno_id   uuid not null,
  periodo     date not null check (extract(day from periodo) = 1),
  concepto    text not null,
  monto       numeric(12,2) not null check (monto >= 0),
  pagado      numeric(12,2) not null default 0 check (pagado >= 0),
  vence_el    date,
  created_at  timestamptz not null default now(),
  foreign key (escuela_id, alumno_id) references public.alumnos (escuela_id, id) on delete cascade
);
create index on public.cobros_alumnos (escuela_id, periodo);

-- Visitas agendadas de profesionales (herrero, veterinario, odontólogo)
create table public.visitas (
  id           uuid primary key default gen_random_uuid(),
  escuela_id   uuid not null references public.escuelas(id) on delete cascade,
  tipo         text not null check (tipo in ('herrero', 'veterinario', 'odontologo')),
  fecha        date not null,
  hora         time,
  profesional  text,
  nota         text,
  created_at   timestamptz not null default now()
);
create index on public.visitas (escuela_id, fecha);

-- RLS: solo el staff de la escuela
alter table public.alumnos        enable row level security;
alter table public.cobros_alumnos enable row level security;
alter table public.visitas        enable row level security;
revoke all on public.alumnos, public.cobros_alumnos, public.visitas from anon;

create policy alumnos_staff on public.alumnos for all to authenticated
  using (public.es_miembro(escuela_id)) with check (public.es_miembro(escuela_id));
create policy cobros_alumnos_staff on public.cobros_alumnos for all to authenticated
  using (public.es_miembro(escuela_id)) with check (public.es_miembro(escuela_id));
create policy visitas_staff on public.visitas for all to authenticated
  using (public.es_miembro(escuela_id)) with check (public.es_miembro(escuela_id));
