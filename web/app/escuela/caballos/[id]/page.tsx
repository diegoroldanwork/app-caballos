'use client'
import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useEscuela } from '@/lib/escuela'
import { Caballo, Alerta, Servicio, linkWhatsApp, origen } from '@/lib/datos'
import { pesos } from '@/lib/formato'
import { Retrato } from '@/components/Retrato'
import { Icono } from '@/components/Icono'
import { Historial } from '@/components/Historial'
import { Sanidad } from '@/components/Sanidad'
import { Cargando } from '@/components/Cargando'

export default function Pagina() {
  return <Suspense fallback={<Cargando />}><FichaCaballo /></Suspense>
}

function FichaCaballo() {
  const { id } = useParams<{ id: string }>()
  const nuevo = useSearchParams().get('nuevo')
  const escuela = useEscuela()
  const [c, setC] = useState<Caballo | null>(null)
  const [alertas, setAlertas] = useState<Alerta[]>([])
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      const [a, b, s] = await Promise.all([
        supabase.from('caballos').select('*, duenos(nombre, telefono)').eq('id', id).single(),
        supabase.from('alertas_sanitarias').select('*').eq('caballo_id', id),
        supabase.from('servicios').select('*').eq('caballo_id', id).order('fecha', { ascending: false }).order('created_at', { ascending: false }),
      ])
      setC(a.data as Caballo); setAlertas((b.data ?? []) as Alerta[]); setServicios((s.data ?? []) as Servicio[])
    })()
  }, [id, escuela.id])

  if (!c) return <Cargando />
  const link = `${origen()}/c/${c.token_publico}`
  const nombreDueno = c.duenos?.nombre?.split(' ')[0] ?? ''
  const mensaje = `Hola ${nombreDueno}! Te dejo la carpeta de ${c.nombre} con todo lo que se le hizo y su sanidad: ${link}`

  async function copiar() {
    try { await navigator.clipboard.writeText(link); setToast('Link copiado') } catch { setToast(link) }
    setTimeout(() => setToast(null), 1800)
  }

  return (
    <>
      <header className="cuero cabecera" style={{ paddingBottom: 26 }}>
        <div className="cabecera-top">
          <Link href="/escuela/caballos" className="volver"><Icono n="flecha" size={18} />Caballos</Link>
          <Link href={`/c/${c.token_publico}`} className="sec" style={{ fontSize: 13 }}>Ver como dueño ›</Link>
        </div>
        <div className="fila" style={{ justifyContent: 'flex-start', gap: 16 }}>
          <Retrato nombre={c.nombre} pelaje={c.pelaje} foto={c.foto_path} size={92} fondo="#F3E6D3" />
          <div>
            <h1>{c.nombre}</h1>
            <div className="sec" style={{ fontSize: 14 }}>{c.raza} · {c.pelaje} · {c.sexo}</div>
            <div className="sec" style={{ fontSize: 14 }}>de {c.duenos?.nombre}</div>
          </div>
        </div>
      </header>

      <div className="contenido">
        <div className="pila entra">
          <Link href={`/escuela/nuevo?caballo=${c.id}`} className="btn btn-suela"><Icono n="mas" size={20} />Cargar servicio</Link>
          <div className="fila" style={{ gap: 8 }}>
            <a className="btn btn-sec" href={linkWhatsApp(c.duenos?.telefono, mensaje)} target="_blank" rel="noreferrer"><Icono n="whatsapp" size={18} />WhatsApp</a>
            <button className="btn btn-sec" onClick={copiar}><Icono n="link" size={18} />Copiar link</button>
          </div>
          {!c.microchip && (
            <div className="alerta-banner">Sin microchip. Va a ser obligatorio desde el 1/3/2027 (Res. SENASA 831/2026).</div>
          )}
        </div>

        <h2>Sanidad</h2>
        <Sanidad alertas={alertas} linkCargar={(t) => `/escuela/nuevo?caballo=${c.id}&tipo=${t}`} />

        <h2 className="fila">Historial <span className="sec">Pensión {pesos(c.cuota_pension)}/mes</span></h2>
        <Historial servicios={servicios} nuevo={nuevo} />
      </div>
      {toast && <div className="toast"><Icono n="check" size={18} />{toast}</div>}
    </>
  )
}
