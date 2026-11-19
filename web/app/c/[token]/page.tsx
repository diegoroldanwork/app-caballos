'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ESTADO_LIQ, pesos, mes, fechaCorta } from '@/lib/formato'
import { Foto } from '@/components/Foto'
import { Historial } from '@/components/Historial'
import { Sanidad } from '@/components/Sanidad'
import { Logo } from '@/components/Logo'
import { Pill } from '@/components/ui'
import { Cargando } from '@/components/Cargando'
import { Firma } from '@/components/Firma'

type Carpeta = {
  caballo: { nombre: string; raza: string | null; pelaje: string | null; sexo: string | null; fecha_nacimiento: string | null; microchip: string | null; foto_path: string | null }
  escuela: { nombre: string; telefono: string | null; localidad: string | null }
  dueno: string
  servicios: { fecha: string; tipo: string; descripcion: string | null; profesional: string | null; costo: number; foto_path: string | null }[]
  alertas: { tipo: string; estado: string; dias_restantes: number | null; vence_el: string | null; ultima_fecha: string | null }[]
  liquidaciones: { periodo: string; estado: string; total: number; pagado: number; vence_el: string | null; token: string }[]
}
const PESTANAS = ['Historial', 'Libreta sanitaria', 'Cuotas'] as const

function edad(f: string | null) {
  if (!f) return null
  return `${Math.floor((Date.now() - new Date(f).getTime()) / 31557600000)} años`
}

export default function CarpetaDueno() {
  const { token } = useParams<{ token: string }>()
  const [c, setC] = useState<Carpeta | null | undefined>(undefined)
  const [tab, setTab] = useState<(typeof PESTANAS)[number]>('Historial')

  useEffect(() => {
    supabase.rpc('carpeta_caballo', { p_token: token }).then(({ data }) => setC((data as Carpeta) ?? null))
  }, [token])

  if (c === undefined) return <Cargando />
  if (c === null) return <div className="app vacio"><Logo /><p style={{ marginTop: 20 }}>Este link ya no es válido. Pedile a la escuela uno nuevo.</p></div>

  const debe = c.liquidaciones.filter((l) => l.estado === 'emitida' || l.estado === 'vencida')
  const saldo = debe.reduce((t, l) => t + Number(l.total) - Number(l.pagado), 0)
  const problemas = c.alertas.filter((a) => a.estado === 'vencido' || (a.estado === 'sin_registro' && ['aie', 'vacuna'].includes(a.tipo)))
  const datos = [c.caballo.raza, c.caballo.pelaje, c.caballo.sexo, edad(c.caballo.fecha_nacimiento)].filter(Boolean).join(' · ')

  return (
    <main className="app">
      <header className="portada-caballo alta">
        <Foto nombre={c.caballo.nombre} foto={c.caballo.foto_path} className="portada-foto" />
        <div className="portada-velo" />
        <div className="portada-top"><span className="eyebrow">{c.escuela.nombre}</span></div>
        <div className="portada-texto">
          <div className="eyebrow">{datos}</div>
          <h1 style={{ fontSize: 56 }}>{c.caballo.nombre}</h1>
          <div className="sec">Carpeta de {c.dueno}{c.caballo.microchip ? ` · Chip ${c.caballo.microchip}` : ''}</div>
        </div>
      </header>

      {saldo > 0 && (
        <div className="contenido" style={{ paddingBottom: 0 }}>
          <div className="saldo entra">
            <div className="eyebrow" style={{ color: 'var(--oro)' }}>Saldo pendiente · {mes(debe[0].periodo)}</div>
            <div className="monto">{pesos(saldo)}</div>
            <Link href={`/l/${debe[0].token}`} className="btn btn-mp">Pagar con Mercado Pago</Link>
          </div>
        </div>
      )}

      <div className="pestanas" role="tablist" style={{ marginTop: saldo > 0 ? 18 : 0 }}>
        {PESTANAS.map((p) => (
          <button key={p} role="tab" aria-selected={tab === p} onClick={() => setTab(p)}>
            {p}{p === 'Libreta sanitaria' && problemas.length ? <span className="aviso-num">{problemas.length}</span> : null}
          </button>
        ))}
      </div>

      <div className="contenido" style={{ paddingTop: 20 }}>
        <div key={tab} className="hoja">
          {tab === 'Historial' && <Historial servicios={c.servicios} />}
          {tab === 'Libreta sanitaria' && (
            <>
              {!c.caballo.microchip && (
                <div className="alerta-banner" style={{ marginBottom: 14 }}>
                  {c.caballo.nombre} aún no tiene microchip. Será obligatorio desde el 1/3/2027 (Res. SENASA 831/2026).
                </div>
              )}
              <Sanidad alertas={c.alertas} />
            </>
          )}
          {tab === 'Cuotas' && (
            <div className="diario">
              {c.liquidaciones.map((l) => (
                <Link key={l.token} href={`/l/${l.token}`}>
                  <span className="grow"><b className="titulo" style={{ fontSize: 19 }}>{mes(l.periodo)}</b><br /><span className="sec">{l.vence_el ? `Vence ${fechaCorta(l.vence_el)}` : ''}</span></span>
                  <span style={{ textAlign: 'right' }}><span className="num-fino">{pesos(l.total)}</span><br /><Pill tono={ESTADO_LIQ[l.estado].tono}>{ESTADO_LIQ[l.estado].texto}</Pill></span>
                </Link>
              ))}
              {!c.liquidaciones.length && <div className="vacio">Todavía no hay cuotas.</div>}
            </div>
          )}
        </div>

        {c.escuela.telefono && (
          <a className="btn btn-sec" style={{ marginTop: 30 }} href={`https://wa.me/${c.escuela.telefono.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">
            Escribirle a {c.escuela.nombre}
          </a>
        )}
        <Firma />
      </div>
    </main>
  )
}
