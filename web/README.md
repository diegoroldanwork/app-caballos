# Querencia · web de la demo

App web (Next.js) pensada para usar desde el celular. Lee y escribe en el proyecto de Supabase `app-caballos`.

| Pantalla | Ruta | Quién la ve |
|---|---|---|
| Portada | `/` | cualquiera |
| Entrar | `/entrar` | la escuela |
| Inicio de la escuela: lo urgente del día, la caballeriza con fotos, la cobranza y lo último cargado | `/escuela` | la escuela |
| Caballos y ficha de cada caballo (compartir carpeta por WhatsApp) | `/escuela/caballos` | la escuela |
| Cargar servicio en 4 toques, con foto desde la cámara | `/escuela/nuevo` | la escuela |
| Sanidad: AIE, vacunas, herraje… | `/escuela/alertas` | la escuela |
| Cobros: generar y emitir liquidaciones, cobrar en efectivo, mandar por WhatsApp | `/escuela/cobros` | la escuela |
| Carpeta del caballo | `/c/<token>` (ej. `/c/demo-duquesa`) | el dueño, sin login |
| Cuota y pago con Mercado Pago (simulado) | `/l/<token>` (ej. `/l/liq-lucia-1`) | el dueño, sin login |

Cada caballo sin foto se dibuja con su pelaje real (`components/Retrato.tsx`). Los colores, la letra y las animaciones están en `app/globals.css`.

## Publicarla en Vercel (gratis)

1. **Crear el usuario de la demo en Supabase.** Entrá a supabase.com → proyecto `app-caballos` → **SQL Editor** → **New query**. Pegá todo `deploy/crear_usuario_demo.sql` y tocá **Run**. Abajo tiene que aparecer una fila con `demo@losaromos.com.ar` y `admin`.
2. **Entrar a Vercel.** Andá a vercel.com → **Sign Up** → **Continue with GitHub** (con la cuenta `diegoroldanwork`). Plan **Hobby** (gratis).
3. **Importar el repo.** **Add New… → Project** → buscá `app-caballos` → **Import**. Si no aparece, tocá **Adjust GitHub App Permissions** y dale acceso a ese repo.
4. **Decirle dónde está la web.** En **Root Directory** tocá **Edit** y elegí la carpeta `web`. El *Framework Preset* tiene que quedar en **Next.js**.
5. **Cargar las variables.** Abrí **Environment Variables** y agregá estas cuatro (nombre y valor):

   | Nombre | Valor |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://sfuuefewwryuirmwkdmh.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API Keys → la **anon / public** |
   | `NEXT_PUBLIC_DEMO_EMAIL` | `demo@losaromos.com.ar` |
   | `NEXT_PUBLIC_DEMO_PASSWORD` | `Tropilla-demo-2026` |

   Opcional: `NEXT_PUBLIC_CONTACTO_WHATSAPP` con tu número (ej. `+549...`) para el botón de contacto al pie de cada carpeta.

   La anon key es pública por diseño: lo que protege los datos son las reglas RLS de la base.
6. **Deploy.** Tocá **Deploy** y esperá 1 o 2 minutos. Te da un link tipo `app-caballos.vercel.app`. Abrilo en el celular.

Cada vez que se mergea algo a `main`, Vercel vuelve a publicar solo.

## Volver a dejar la demo como nueva

Después de grabar (pagar la cuota de Lucía, cargar servicios, etc.) pegá `deploy/reiniciar_demo.sql` en el SQL Editor y corrélo. Borra la escuela de demo y la vuelve a cargar con fechas de hoy; el usuario demo sigue funcionando.

> Ojo: el usuario y la contraseña de la demo quedan visibles en la web (se autocompletan para grabar rápido). Sirve para mostrar, no para datos reales.

## Correrla en una compu

```bash
cd web
cp .env.example .env.local   # y completá la anon key y la contraseña
npm install
npm run dev                  # http://localhost:3000
```

## Fotos de la demo

Mientras la escuela no suba fotos, los caballos de la demo usan fotos libres de [Unsplash](https://unsplash.com/license) (Glen Carrie, Petra Marita Leifsdóttir, Helena Lopes, Luisa Peter, Michael Anfang, Mathias Reding, Raphael Wicker). Están en `components/Foto.tsx`. Para usar fotos propias, poné `duquesa.jpg`, `portada.jpg`, etc. en `public/caballos/` y sacá la línea correspondiente de esa lista, o subí la foto desde la ficha del caballo (botón de cámara).
