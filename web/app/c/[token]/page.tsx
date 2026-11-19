'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ESTADO_LIQ, pesos, mes, fechaCorta } from '@/lib/formato'
import { Retrato } from '@/components/Retrato'
import { Historial } from '@/components/Historial'
import { Sanidad } from '@/components/Sanidad'
import { Logo } from '@/components/Logo'
import { Pill, Contador } from '@/components/ui'
import { Cargando } from '@/components/Cargando'

type Carpeta = {
  caballo: { nombre: string; raza: string | null; pelaje: string | null; sexo: string | null; fecha_nacimiento: string | null; microchip: string | null; foto_path: string | null }
  escuela: { nombre: string; telefono: string | null; localidad: string | null }
  dueno: string
  servicios: { fecha: string; tipo: string; descripcion: string | null; profesional: string | null; costo: number; foto_path: string | null }[]
  alertas: { tipo: string; estado: string; dias_restantes: number | null; vence_el: string | null }[]
  liquidaciones: { periodo: string; estado: string; total: number; pagado: number; vence_el: string | null; token: string }[]
}
const PESTANAS = ['Historial', 'Sanidad', 'Cuotas'] as const

function edad(f: string | null) {
  if (!f) return null
  const a = Math.floor((Date.now() - new Date(f).getTime()) / 31557600000)
  return `${a} años`
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
  const nombreDueno = c.dueno.split(' ')[0]
  const datos = [c.caballo.raza, c.caballo.pelaje, c.caballo.sexo, edad(c.caballo.fecha_nacimiento)].filter(Boolean).join(' · ')

  return (
    <main className="app">
      <header className="cuero cabecera" style={{ paddingBottom: 44, textAlign: 'center' }}>
        <div className="sec" style={{ fontSize: 13, letterSpacing: '.04em' }}>{c.escuela.nombre}</div>
        <div style={{ display: 'flex', justifyContent: 'center', margin: '18px 0 12px' }}>
          <div style={{ padding: 5, borderRadius: '50%', border: '2px dashed rgba(243,230,211,.5)' }}>
            <Retrato nombre={c.caballo.nombre} pelaje={c.caballo.pelaje} foto={c.caballo.foto_path} size={128} />
          </div>
        </div>
        <h1 style={{ fontSize: 40 }}>{c.caballo.nombre}</h1>
        <div className="sec" style={{ fontSize: 14, marginTop: 4 }}>{datos}</div>
        <div className="sec" style={{ fontSize: 14 }}>Carpeta de {nombreDueno}{c.caballo.microchip ? ` · Chip ${c.caballo.microchip}` : ''}</div>
      </header>

      <div className="pestanas" role="tablist">
        {PESTANAS.map((p) => (
          <button key={p} role="tab" aria-selected={tab === p} onClick={() => setTab(p)}>
            {p}{p === 'Sanidad' && problemas.length ? ` · ${problemas.length}` : ''}
          </button>
        ))}
      </div>

      <div className="contenido" style={{ paddingTop: 16 }}>
        {saldo > 0 && (
          <div className="saldo entra" style={{ marginBottom: 18 }}>
            <div className="sec">Tenés un saldo pendiente</div>
            <div className="monto"><Contador valor={saldo} formato={pesos} /></div>
            <Link href={`/l/${debe[0].token}`} className="btn btn-mp">Pagar con Mercado Pago</Link>
          </div>
        )}

        <div key={tab} className="hoja">
          {tab === 'Historial' && (
            <>
              <p className="sec" style={{ marginBottom: 12 }}>Todo lo que se le hizo a {c.caballo.nombre}, con fotos.</p>
              <Historial servicios={c.servicios} />
            </>
          )}
          {tab === 'Sanidad' && (
            <>
              {!c.caballo.microchip && (
                <div className="alerta-banner" style={{ marginBottom: 12 }}>
                  {c.caballo.nombre} todavía no tiene microchip. Va a ser obligatorio desde el 1/3/2027 (Res. SENASA 831/2026).
                </div>
              )}
              <Sanidad alertas={c.alertas} />
            </>
          )}
          {tab === 'Cuotas' && (
            <div className="lista entra">
              {c.liquidaciones.map((l) => (
                <Link key={l.token} href={`/l/${l.token}`}>
                  <div className="grow"><div>{mes(l.periodo)}</div><div className="sec">{l.vence_el ? `Vence ${fechaCorta(l.vence_el)}` : ''}</div></div>
                  <div style={{ textAlign: 'right' }}><div className="num">{pesos(l.total)}</div><Pill tono={ESTADO_LIQ[l.estado].tono}>{ESTADO_LIQ[l.estado].texto}</Pill></div>
                </Link>
              ))}
              {!c.liquidaciones.length && <div className="vacio">Todavía no hay cuotas.</div>}
            </div>
          )}
        </div>

        <div className="pie">
          {c.escuela.telefono && <a className="btn btn-sec btn-chico" href={`https://wa.me/${c.escuela.telefono.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">Escribirle a la escuela</a>}
          <span>Carpeta hecha con</span>
          <Logo size={22} />
        </div>
      </div>
    </main>
  )
}
