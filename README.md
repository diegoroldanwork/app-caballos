# App Caballos

App para escuelas de equitación y polo que pensionan caballos: registro de servicios (herrador, veterinario) con costo y foto, carpeta del caballo para el dueño por link, liquidación mensual con extras, cobro por Mercado Pago y alertas sanitarias.

Este repo tiene el **modelo de datos en Supabase**, un **seed de demo** y la **web de la demo** (marca: *Querencia*) en [`web/`](web/README.md). Ahí están los pasos para publicarla en Vercel.

## Modelo

```
escuelas ──< miembros_escuela >── auth.users      (staff que usa la app)
   │
   ├──< duenos ──< caballos ──< servicios          (la carpeta del caballo)
   │                  │
   ├──< reglas_alerta │  → vista alertas_sanitarias (AIE, vacunas, herraje...)
   │                  │
   └──< liquidaciones ──< liquidacion_items         (pensión + extras del mes)
            │
            └──< pagos                              (Mercado Pago, efectivo, transferencia)
```

| Tabla | Para qué |
|---|---|
| `escuelas` | El cliente que paga la suscripción. Día de vencimiento de las cuotas, alias de MP. |
| `miembros_escuela` | Quién trabaja en cada escuela (`admin` o `staff`). Es la base del multi-escuela. |
| `duenos` | Dueños de los caballos. Sin login: reciben links. Teléfono en formato +549… para WhatsApp. |
| `caballos` | Datos del caballo, microchip (obligatorio desde 1/3/2027), cuota de pensión y `token_publico` para el link de la carpeta. |
| `servicios` | Todo lo que se le hace al caballo: tipo, fecha, profesional, costo, foto, si se cobra como extra. Cuando se liquida queda atado a la liquidación. |
| `reglas_alerta` | Cada cuántos días vence cada cosa, por escuela (AIE 60, vacuna 180, herraje 45, desparasitación 90, odontología 365, ajustables). |
| `alertas_sanitarias` (vista) | Último registro de cada tipo por caballo, con estado `al_dia`, `por_vencer`, `vencido` o `sin_registro`. |
| `liquidaciones` | Una por dueño y mes: `borrador → emitida → pagada / vencida`. Tiene su propio `token_publico` para el link de pago. |
| `liquidacion_items` | Renglones: pensión por caballo, cada extra, ajustes. |
| `pagos` | Cada pago. Los de MP son idempotentes por `mp_payment_id`. Un trigger recalcula lo pagado y pasa la liquidación a `pagada`. |

### Funciones principales

| Función | Quién la llama | Qué hace |
|---|---|---|
| `crear_escuela(nombre, localidad)` | usuario logueado | Crea la escuela, lo hace admin y carga reglas por defecto. |
| `generar_liquidaciones(escuela, periodo)` | staff o n8n | Arma el borrador del mes de cada dueño: pensión + todos los extras sin liquidar hasta fin de mes (un herraje cargado tarde no se pierde). Se puede correr varias veces mientras esté en borrador. |
| `emitir_liquidacion(id)` | staff o n8n | Congela la liquidación y fija el vencimiento. Después no se pueden tocar los ítems. |
| `marcar_vencidas()` | cron de n8n (service_role) | Pasa a `vencida` lo emitido que pasó la fecha. |
| `carpeta_caballo(token)` | **dueño, sin login** | Devuelve el caballo, su historial de servicios con fotos, alertas y las liquidaciones del dueño. |
| `liquidacion_publica(token)` | **dueño, sin login** | Devuelve el detalle de la liquidación, saldo y link de pago. |
| `registrar_pago_mp(...)` | webhook de MP (service_role) | Registra o actualiza el pago. |
| `simular_pago_mp(token)` | **solo demo** | Paga el saldo como si viniera de MP. Borrarla antes de producción. |
| `regenerar_token_caballo(id)` | staff | Invalida el link anterior de la carpeta. |

### Seguridad (RLS)

- Un usuario logueado ve y edita **solo** lo de las escuelas donde es miembro. Configurar reglas, gestionar miembros y corregir pagos es solo para `admin`.
- El rol `anon` no puede leer ninguna tabla. El dueño entra por link y solo ve lo que corresponde a ese token, a través de `carpeta_caballo` y `liquidacion_publica`.
- Los pagos de Mercado Pago solo los puede registrar el backend (service_role). El staff carga a mano efectivo y transferencias.
- Fotos: bucket `fotos`, rutas `{escuela_id}/{caballo_id}/{archivo}`. Solo el staff de esa escuela sube o borra. La lectura es por URL pública (rutas con UUID) para que el dueño las vea sin login; para producción conviene bucket privado con URLs firmadas.
- Al crear tablas nuevas, revocar el acceso de `anon` (Supabase se lo da por defecto).

## Cómo aplicarlo en un proyecto nuevo de Supabase

**Opción A, con la CLI** (recomendada):

```bash
npm i -g supabase
supabase login
supabase link --project-ref <ref-del-proyecto>
supabase db push          # aplica supabase/migrations
psql "$(supabase db url)" -f supabase/seed.sql   # o pegá seed.sql en el SQL Editor
```

**Opción B, desde el panel:** SQL Editor → pegar y correr, en orden, los 5 archivos de `supabase/migrations/` y después `supabase/seed.sql`.

Después, para entrar como la escuela de demo: crear un usuario en Authentication → Users y correr el `insert into miembros_escuela` que está comentado al final de `seed.sql`.

## Datos de la demo

**Escuela Ecuestre Los Aromos** (Cañuelas, ficticia), 4 dueños y 6 caballos. Las fechas se calculan desde el día en que se corre el seed, así siempre hay alertas y cobros "de este mes".

| Caballo | Dueño | Link de la carpeta (token) | Para mostrar |
|---|---|---|---|
| Lucero | Martina Fernández | `demo-lucero` | Herraje, vacuna y AIE por vencer |
| Morena | Martina Fernández | `demo-morena` | Al día, con historial de renguera |
| Pampa | Joaquín Ríos | `demo-pampa` | Herraje y AIE vencidos |
| Rayo | Lucía Sosa | `demo-rayo` | Vacuna por vencer |
| Duquesa | Lucía Sosa | `demo-duquesa` | Sin microchip, sin AIE, vacuna vencida, cólico reciente |
| Tango | Tomás Aguirre | `demo-tango` | Herrado hace 5 días |

Liquidaciones (token `liq-<dueño>-<meses atrás>`):

- Hace 2 meses: todas pagadas.
- Mes pasado: Martina pagó por MP, Joaquín en efectivo, Tomás pagó la mitad (`liq-tomas-1`, vencida) y Lucía no pagó nada (`liq-lucia-1`, vencida).
- Mes actual: servicios cargados sin liquidar, listos para mostrar `generar_liquidaciones` en vivo.

Ejemplo desde el front:

```js
const { data } = await supabase.rpc('carpeta_caballo', { p_token: 'demo-duquesa' })
await supabase.rpc('simular_pago_mp', { p_token: 'liq-lucia-1' })
```

## Probar sin Supabase

`tests/run_local.sh` levanta todo en un Postgres 16 local con un shim que imita `auth` y `storage`, corre el seed y una batería de chequeos de RLS (los `ERROR` que imprime son los bloqueos esperados).

```bash
PGHOST=/var/run/postgresql PGUSER=postgres bash tests/run_local.sh
```
