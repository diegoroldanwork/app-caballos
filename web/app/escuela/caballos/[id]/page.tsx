'use client'
import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useEscuela } from '@/lib/escuela'
import { Caballo, Alerta, Servicio, linkWhatsApp, origen } from '@/lib/datos'
import { pesos } from '@/lib/formato'
import { comprimir } from '@/lib/foto'
import { Foto } from '@/components/Foto'
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

  useEffect(() => {
    if (nuevo) setTimeout(() => document.getElementById('historial')?.scrollIntoView({ behavior: 'smooth' }), 400)
  }, [nuevo, servicios.length])

  if (!c) return <Cargando />
  const link = `${origen()}/c/${c.token_publico}`
  const mensaje = `Hola ${c.duenos?.nombre?.split(' ')[0] ?? ''}, te comparto la carpeta de ${c.nombre}: ${link}`

  function aviso(t: string) { setToast(t); setTimeout(() => setToast(null), 1800) }
  async function copiar() { try { await navigator.clipboard.writeText(link); aviso('Link copiado') } catch { aviso(link) } }
  async function cambiarFoto(f?: File) {
    if (!f || !c) return
    setToast('Subiendo foto…')
    const path = `${escuela.id}/${c.id}/perfil-${crypto.randomUUID()}.jpg`
    const up = await supabase.storage.from('fotos').upload(path, await comprimir(f, 1600), { contentType: 'image/jpeg' })
    const { error } = up.error ? up : await supabase.from('caballos').update({ foto_path: path }).eq('id', c.id)
    if (error) return aviso('No se pudo subir la foto')
    setC({ ...c, foto_path: path }); aviso('Foto actualizada')
  }

  return (
    <>
      <header className="portada-caballo">
        <Foto nombre={c.nombre} foto={c.foto_path} className="portada-foto" />
        <div className="portada-velo" />
        <div className="portada-top">
          <Link href="/escuela/caballos" className="volver"><Icono n="flecha" size={18} />Caballeriza</Link>
          <label className="btn-icono" title="Cambiar foto" style={{ cursor: 'pointer' }}>
            <Icono n="camara" size={16} />
            <input type="file" accept="image/*" hidden onChange={(e) => cambiarFoto(e.target.files?.[0])} />
          </label>
        </div>
        <div className="portada-texto">
          <div className="eyebrow">{c.raza} · {c.pelaje} · {c.sexo}</div>
          <h1>{c.nombre}</h1>
          <div className="sec">Propiedad de {c.duenos?.nombre} · Pensión {pesos(c.cuota_pension)}</div>
        </div>
      </header>

      <div className="contenido">
        <div className="pila entra">
          <Link href={`/escuela/nuevo?caballo=${c.id}`} className="btn"><Icono n="mas" size={18} />Registrar un servicio</Link>
          <div className="fila" style={{ gap: 8 }}>
            <a className="btn btn-sec" href={linkWhatsApp(c.duenos?.telefono, mensaje)} target="_blank" rel="noreferrer"><Icono n="whatsapp" size={17} />Enviar carpeta</a>
            <Link className="btn btn-sec" href={`/c/${c.token_publico}`}>Ver como dueño</Link>
          </div>
          <button className="enlace" onClick={copiar}><Icono n="link" size={14} /> Copiar link de la carpeta</button>
          {!c.microchip && <div className="alerta-banner">Sin microchip. Será obligatorio desde el 1/3/2027 (Res. SENASA 831/2026).</div>}
        </div>

        <h2>Libreta sanitaria</h2>
        <Sanidad alertas={alertas} linkCargar={(t) => `/escuela/nuevo?caballo=${c.id}&tipo=${t}`} />

        <h2 id="historial">Historial</h2>
        <Historial servicios={servicios} nuevo={nuevo} />
      </div>
      {toast && <div className="toast"><Icono n="check" size={16} />{toast}</div>}
    </>
  )
}
