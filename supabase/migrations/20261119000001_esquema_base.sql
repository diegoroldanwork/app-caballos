-- =====================================================================
-- App Caballos · Esquema base
-- Escuelas de equitación/polo que pensionan caballos.
-- Multi-escuela: cada fila de negocio lleva escuela_id y RLS la aísla.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------
create type public.rol_miembro as enum ('admin', 'staff');

create type public.tipo_servicio as enum (
  'herraje',
  'veterinario',
  'vacuna',
  'aie',              -- análisis de Anemia Infecciosa Equina
  'desparasitacion',
  'odontologia',
  'otro'
);

create type public.estado_liquidacion as enum (
  'borrador',   -- generada, todavía editable
  'emitida',    -- enviada al dueño, esperando pago
  'pagada',
  'vencida',
  'anulada'
);

create type public.tipo_item as enum ('pension', 'extra', 'ajuste');

create type public.metodo_pago as enum ('mercadopago', 'transferencia', 'efectivo');

create type public.estado_pago as enum ('pendiente', 'aprobado', 'rechazado', 'reintegrado');

-- Token para links públicos (carpeta del caballo, liquidación).
-- 24 bytes aleatorios en base64url ≈ 32 caracteres, no adivinable.
create or replace function public.nuevo_token()
returns text
language sql
volatile
as $$
  select translate(encode(gen_random_bytes(24), 'base64'), '+/=', '-_');
$$;

-- ---------------------------------------------------------------------
-- Escuelas y quién trabaja en cada una
-- ---------------------------------------------------------------------
create table public.escuelas (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  cuit        text,
  localidad   text,
  telefono    text,
  email       text,
  -- Datos para cobrar. El access token de Mercado Pago NO va acá:
  -- se guarda como secreto de la Edge Function / n8n.
  mp_alias    text,
  dia_vencimiento smallint not null default 10 check (dia_vencimiento between 1 and 28),
  created_at  timestamptz not null default now()
);

create table public.miembros_escuela (
  escuela_id  uuid not null references public.escuelas(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  rol         public.rol_miembro not null default 'staff',
  created_at  timestamptz not null default now(),
  primary key (escuela_id, user_id)
);
create index on public.miembros_escuela (user_id);

-- ---------------------------------------------------------------------
-- Dueños y caballos
-- ---------------------------------------------------------------------
create table public.duenos (
  id          uuid primary key default gen_random_uuid(),
  escuela_id  uuid not null references public.escuelas(id) on delete cascade,
  nombre      text not null,
  dni_cuit    text,
  email       text,
  telefono    text,             -- formato E.164 (+549...), para WhatsApp
  notas       text,
  created_at  timestamptz not null default now(),
  unique (escuela_id, id)
);
create index on public.duenos (escuela_id);

create table public.caballos (
  id               uuid primary key default gen_random_uuid(),
  escuela_id       uuid not null references public.escuelas(id) on delete cascade,
  dueno_id         uuid not null,
  nombre           text not null,
  raza             text,
  pelaje           text,
  sexo             text check (sexo in ('macho', 'hembra', 'castrado')),
  fecha_nacimiento date,
  microchip        text,        -- obligatorio desde 1/3/2027 (Res. SENASA 831/2026)
  renspa           text,
  foto_path        text,        -- ruta en el bucket "fotos"
  cuota_pension    numeric(12,2) not null default 0 check (cuota_pension >= 0),
  activo           boolean not null default true,
  token_publico    text not null unique default public.nuevo_token(),
  created_at       timestamptz not null default now(),
  unique (escuela_id, id),
  -- el dueño tiene que ser de la misma escuela
  foreign key (escuela_id, dueno_id) references public.duenos (escuela_id, id)
);
create index on public.caballos (escuela_id);
create index on public.caballos (dueno_id);
create unique index caballos_microchip_unico on public.caballos (microchip) where microchip is not null;

-- ---------------------------------------------------------------------
-- Servicios (herrador, vete, vacunas...) = la carpeta del caballo
-- ---------------------------------------------------------------------
create table public.servicios (
  id              uuid primary key default gen_random_uuid(),
  escuela_id      uuid not null,
  caballo_id      uuid not null,
  tipo            public.tipo_servicio not null,
  fecha           date not null default current_date,
  descripcion     text,
  profesional     text,           -- "Herrador Juan Pérez", "Vet. M. Gómez MP 1234"
  costo           numeric(12,2) not null default 0 check (costo >= 0),
  -- si se cobra al dueño como extra en la liquidación
  facturable      boolean not null default true,
  -- vencimiento manual (si no, se calcula con reglas_alerta)
  vence_el        date,
  foto_path       text,           -- ruta en el bucket "fotos"
  liquidacion_id  uuid,           -- se completa al liquidar
  created_by      uuid references auth.users(id) default auth.uid(),
  created_at      timestamptz not null default now(),
  foreign key (escuela_id, caballo_id) references public.caballos (escuela_id, id) on delete cascade
);
create index on public.servicios (caballo_id, fecha desc);
create index on public.servicios (escuela_id, fecha);
create index servicios_sin_liquidar on public.servicios (escuela_id, fecha)
  where liquidacion_id is null and facturable;

-- ---------------------------------------------------------------------
-- Reglas de alertas sanitarias, configurables por escuela
-- ---------------------------------------------------------------------
create table public.reglas_alerta (
  escuela_id     uuid not null references public.escuelas(id) on delete cascade,
  tipo           public.tipo_servicio not null,
  dias_validez   integer not null check (dias_validez > 0),
  dias_aviso     integer not null default 15 check (dias_aviso >= 0),
  primary key (escuela_id, tipo)
);

-- ---------------------------------------------------------------------
-- Liquidaciones mensuales (una por dueño y mes) y sus ítems
-- ---------------------------------------------------------------------
create table public.liquidaciones (
  id                 uuid primary key default gen_random_uuid(),
  escuela_id         uuid not null references public.escuelas(id) on delete cascade,
  dueno_id           uuid not null,
  periodo            date not null check (extract(day from periodo) = 1), -- primer día del mes
  estado             public.estado_liquidacion not null default 'borrador',
  total              numeric(12,2) not null default 0,
  pagado             numeric(12,2) not null default 0,
  fecha_emision      date,
  fecha_vencimiento  date,
  -- Mercado Pago (Checkout Pro). En la demo puede quedar simulado.
  mp_preference_id   text,
  mp_init_point      text,
  token_publico      text not null unique default public.nuevo_token(),
  created_at         timestamptz not null default now(),
  unique (escuela_id, dueno_id, periodo),
  unique (escuela_id, id),
  foreign key (escuela_id, dueno_id) references public.duenos (escuela_id, id)
);
create index on public.liquidaciones (escuela_id, periodo);
create index on public.liquidaciones (dueno_id);

alter table public.servicios
  add constraint servicios_liquidacion_fk
  foreign key (liquidacion_id) references public.liquidaciones(id) on delete set null;

create table public.liquidacion_items (
  id              uuid primary key default gen_random_uuid(),
  liquidacion_id  uuid not null references public.liquidaciones(id) on delete cascade,
  escuela_id      uuid not null,
  caballo_id      uuid,
  servicio_id     uuid unique references public.servicios(id) on delete set null,
  tipo            public.tipo_item not null,
  concepto        text not null,
  monto           numeric(12,2) not null
);
create index on public.liquidacion_items (liquidacion_id);

-- ---------------------------------------------------------------------
-- Pagos (Mercado Pago o manuales)
-- ---------------------------------------------------------------------
create table public.pagos (
  id              uuid primary key default gen_random_uuid(),
  escuela_id      uuid not null,
  liquidacion_id  uuid not null,
  metodo          public.metodo_pago not null,
  estado          public.estado_pago not null default 'pendiente',
  monto           numeric(12,2) not null check (monto > 0),
  mp_payment_id   text unique,
  pagado_el       timestamptz,
  detalle         jsonb,          -- payload del webhook, comprobante, etc.
  created_at      timestamptz not null default now(),
  foreign key (escuela_id, liquidacion_id) references public.liquidaciones (escuela_id, id) on delete cascade
);
create index on public.pagos (liquidacion_id);
