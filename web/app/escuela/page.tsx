'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useEscuela } from '@/lib/escuela'
import { traerCaballos, traerAlertas, peorPorCaballo, importa, gravedad, COLOR_ESTADO, Caballo, Alerta, Servicio } from '@/lib/datos'
import { TIPOS, ESTADO_ALERTA, pesos, hace, textoVence } from '@/lib/formato'
import { Retrato } from '@/components/Retrato'
import { Icono } from '@/components/Icono'
import { Isotipo } from '@/components/Logo'
import { Pill, Contador } from '@/components/ui'
import { Cargando } from '@/components/Cargando'

function saludo() {
  const h = new Date().getHours()
  return h < 13 ? 'Buen día' : h < 20 ? 'Buenas tardes' : 'Buenas noches'
}

export default function Inicio() {
  const escuela = useEscuela()
  const router = useRouter()
  const [caballos, setCaballos] = useState<Caballo[] | null>(null)
  const [alertas, setAlertas] = useState<Alerta[]>([])
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [porCobrar, setPorCobrar] = useState(0)
  const [vencido, setVencido] = useState(0)

  useEffect(() => {
    ;(async () => {
      const [c, a, s, l] = await Promise.all([
        traerCaballos(escuela.id),
        traerAlertas(escuela.id),
        supabase.from('servicios').select('*').eq('escuela_id', escuela.id).order('fecha', { ascending: false }).order('created_at', { ascending: false }).limit(5),
        supabase.from('liquidaciones').select('estado,total,pagado').eq('escuela_id', escuela.id).in('estado', ['emitida', 'vencida']),
      ])
      setCaballos(c); setAlertas(a); setServicios((s.data ?? []) as Servicio[])
      const ls = l.data ?? []
      setPorCobrar(ls.reduce((t, x) => t + Number(x.total) - Number(x.pagado), 0))
      setVencido(ls.filter((x) => x.estado === 'vencida').reduce((t, x) => t + Number(x.total) - Number(x.pagado), 0))
    })()
  }, [escuela.id])

  if (!caballos) return <Cargando />
  const peor = peorPorCaballo(alertas)
  const urgentes = alertas.filter(importa).sort((a, b) => gravedad(b.estado) - gravedad(a.estado) || (a.dias_restantes ?? -999) - (b.dias_restantes ?? -999))
  const porId = Object.fromEntries(caballos.map((c) => [c.id, c]))

  async function salir() { await supabase.auth.signOut(); router.replace('/') }

  return (
    <>
      <header className="cuero cabecera">
        <div className="cabecera-top">
          <span className="logo"><Isotipo size={30} fondo="var(--crudo)" tinta="var(--suela)" /><span className="sec" style={{ fontSize: 14 }}>{escuela.nombre}</span></span>
          <button className="btn-icono" onClick={salir} aria-label="Salir"><Icono n="salir" size={18} /></button>
        </div>
        <h1>{saludo()}.</h1>
        <p className="sec" style={{ marginTop: 4, fontSize: 15 }}>
          {urgentes.length ? `${urgentes.length} controles de sanidad para mirar.` : 'La tropilla está al día.'}
        </p>
      </header>

      <div className="contenido entra">
        <div className="kpis">
          <Link href="/escuela/cobros" className="kpi costura"><span>Por cobrar</span><b><Contador valor={porCobrar} formato={pesos} /></b></Link>
          <Link href="/escuela/cobros" className={`kpi costura ${vencido ? 'kpi-mal' : ''}`}><span>Vencido</span><b><Contador valor={vencido} formato={pesos} /></b></Link>
        </div>

        <div>
          <h2 className="fila">La tropilla <span className="sec">{caballos.length} caballos · deslizá</span></h2>
          <div className="tropilla">
            {caballos.map((c) => (
              <Link key={c.id} href={`/escuela/caballos/${c.id}`}>
                <span className="marco">
                  <Retrato nombre={c.nombre} pelaje={c.pelaje} foto={c.foto_path} size={92} />
                  <span className="punto" style={{ background: COLOR_ESTADO[peor[c.id] ?? 'al_dia'] }} />
                </span>
                <div className="nombre">{c.nombre}</div>
                <div className="sec">{c.pelaje}</div>
              </Link>
            ))}
          </div>
        </div>

        {urgentes.length > 0 && (
          <div>
            <h2 className="fila">Para atender <Link href="/escuela/alertas" className="sec">Ver todo ›</Link></h2>
            <div className="lista">
              {urgentes.slice(0, 4).map((a) => (
                <Link key={a.caballo_id + a.tipo} href={`/escuela/nuevo?caballo=${a.caballo_id}&tipo=${a.tipo}`}>
                  <Retrato nombre={a.caballo} pelaje={porId[a.caballo_id]?.pelaje} size={40} />
                  <div className="grow"><div>{a.caballo} · {TIPOS[a.tipo]?.nombre}</div><div className="sec">{textoVence(a.dias_restantes, a.estado)}</div></div>
                  <Pill tono={ESTADO_ALERTA[a.estado].tono}>{ESTADO_ALERTA[a.estado].texto}</Pill>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div>
          <h2>Lo último que se cargó</h2>
          <div className="lista">
            {servicios.map((s) => (
              <Link key={s.id} href={`/escuela/caballos/${s.caballo_id}`}>
                <span className="icono-tipo"><Icono n={TIPOS[s.tipo]?.icono} /></span>
                <div className="grow"><div>{porId[s.caballo_id]?.nombre} · {TIPOS[s.tipo]?.nombre}</div><div className="sec">{s.descripcion ?? s.profesional} · {hace(s.fecha)}</div></div>
                <span className="num">{s.costo > 0 ? pesos(s.costo) : ''}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
