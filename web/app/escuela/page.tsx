'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useEscuela } from '@/lib/escuela'
import { traerCaballos, traerAlertas, peorPorCaballo, importa, gravedad, COLOR_ESTADO, Caballo, Alerta, Servicio } from '@/lib/datos'
import { TIPOS, pesos, hace, textoVence, mes } from '@/lib/formato'
import { Foto } from '@/components/Foto'
import { Icono } from '@/components/Icono'
import { Isotipo } from '@/components/Logo'
import { fechaLarga } from '@/components/ui'
import { Cargando } from '@/components/Cargando'

const NUM = ['Nada', 'Una', 'Dos', 'Tres', 'Cuatro', 'Cinco', 'Seis', 'Siete', 'Ocho', 'Nueve', 'Diez']

const FEM: Record<string, boolean> = { aie: true, vacuna: true, desparasitacion: true, odontologia: true }
function frase(a: Alerta) {
  const f = FEM[a.tipo], t = a.tipo === 'aie' ? 'AIE' : TIPOS[a.tipo]?.nombre.toLowerCase()
  if (a.estado === 'sin_registro') return <>no tiene registrad{f ? 'a' : 'o'} {f ? 'la' : 'el'} <b>{t}</b>.</>
  if (a.estado === 'vencido') return <>tiene {f ? 'la' : 'el'} <b>{t}</b> vencid{f ? 'a' : 'o'} hace {-(a.dias_restantes ?? 0)} días.</>
  return <>{f ? 'La' : 'El'} <b>{t}</b> vence en {a.dias_restantes} días.</>
}

export default function Inicio() {
  const escuela = useEscuela()
  const router = useRouter()
  const [caballos, setCaballos] = useState<Caballo[] | null>(null)
  const [alertas, setAlertas] = useState<Alerta[]>([])
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [cobro, setCobro] = useState<{ periodo: string; total: number; pagado: number; deben: number } | null>(null)

  useEffect(() => {
    ;(async () => {
      const [c, a, s, l] = await Promise.all([
        traerCaballos(escuela.id),
        traerAlertas(escuela.id),
        supabase.from('servicios').select('*').eq('escuela_id', escuela.id).order('fecha', { ascending: false }).order('created_at', { ascending: false }).limit(4),
        supabase.from('liquidaciones').select('periodo,estado,total,pagado').eq('escuela_id', escuela.id).neq('estado', 'borrador').neq('estado', 'anulada').order('periodo', { ascending: false }),
      ])
      setCaballos(c); setAlertas(a); setServicios((s.data ?? []) as Servicio[])
      const ls = l.data ?? []
      if (ls.length) {
        const p = ls[0].periodo, del = ls.filter((x) => x.periodo === p)
        setCobro({ periodo: p, total: del.reduce((t, x) => t + Number(x.total), 0), pagado: del.reduce((t, x) => t + Number(x.pagado), 0),
          deben: del.filter((x) => Number(x.pagado) < Number(x.total)).length })
      }
    })()
  }, [escuela.id])

  if (!caballos) return <Cargando />
  const peor = peorPorCaballo(alertas)
  const urgentes = alertas.filter(importa).sort((a, b) => gravedad(b.estado) - gravedad(a.estado) || (a.dias_restantes ?? -999) - (b.dias_restantes ?? -999))
  const porId = Object.fromEntries(caballos.map((c) => [c.id, c]))
  const avance = cobro && cobro.total ? cobro.pagado / cobro.total : 0
  const n = Math.min(urgentes.length, 4)

  async function salir() { await supabase.auth.signOut(); router.replace('/') }

  return (
    <>
      <header className="cuero cabecera">
        <div className="cabecera-top">
          <span className="logo"><Isotipo size={22} color="var(--oro)" /><span className="eyebrow">{escuela.nombre}</span></span>
          <button className="btn-icono" onClick={salir} aria-label="Salir"><Icono n="salir" size={16} /></button>
        </div>
        <div className="sec" style={{ fontSize: 13 }}>{fechaLarga()}</div>
        <h1 style={{ marginTop: 6 }}>{n ? `${NUM[n]} cosas para hoy.` : 'Todo en orden.'}</h1>
      </header>

      <div className="contenido">
        {n > 0 && (
          <ol className="agenda entra">
            {urgentes.slice(0, 4).map((a) => (
              <li key={a.caballo_id + a.tipo}>
                <Link href={`/escuela/nuevo?caballo=${a.caballo_id}&tipo=${a.tipo}`}>
                  <span className="marca-estado" style={{ background: COLOR_ESTADO[a.estado] }} />
                  <span className="grow"><b className="titulo">{a.caballo}</b> {frase(a)}</span>
                  <span className="accion">Registrar</span>
                </Link>
              </li>
            ))}
            {urgentes.length > 4 && <li className="sec" style={{ paddingLeft: 18 }}><Link href="/escuela/alertas">y {urgentes.length - 4} más en Sanidad →</Link></li>}
          </ol>
        )}

        <h2 className="fila">La caballeriza <Link href="/escuela/caballos" className="sec">Ver todos</Link></h2>
        <div className="galeria">
          {caballos.map((c) => (
            <Link key={c.id} href={`/escuela/caballos/${c.id}`} className="cuadro">
              <Foto nombre={c.nombre} foto={c.foto_path} />
              <span className="cuadro-pie">
                <span className="punto" style={{ background: COLOR_ESTADO[peor[c.id] ?? 'al_dia'] }} />
                <b>{c.nombre}</b>
                <small>{c.pelaje} · {c.duenos?.nombre?.split(' ')[0]}</small>
              </span>
            </Link>
          ))}
        </div>

        {cobro && (
          <>
            <h2 className="fila">Cobranza de {mes(cobro.periodo).split(' ')[0].toLowerCase()} <Link href="/escuela/cobros" className="sec">Ver detalle</Link></h2>
            <Link href="/escuela/cobros" className="cobranza">
              <div className="fila" style={{ alignItems: 'baseline' }}>
                <span className="titulo" style={{ fontSize: 30 }}>{pesos(cobro.pagado)}</span>
                <span className="sec">de {pesos(cobro.total)}</span>
              </div>
              <div className="regla"><div style={{ width: `${avance * 100}%` }} /></div>
              <div className="sec">{cobro.deben ? `${cobro.deben} ${cobro.deben === 1 ? 'dueño tiene' : 'dueños tienen'} saldo pendiente · ${pesos(cobro.total - cobro.pagado)}` : 'Todos pagaron'}</div>
            </Link>
          </>
        )}

        <h2>Últimos registros</h2>
        <div className="diario">
          {servicios.map((s) => (
            <Link key={s.id} href={`/escuela/caballos/${s.caballo_id}`}>
              <span className="diario-fecha">{hace(s.fecha)}</span>
              <span className="grow"><b>{porId[s.caballo_id]?.nombre}</b> · {TIPOS[s.tipo]?.nombre}<br /><span className="sec">{s.descripcion ?? s.profesional}</span></span>
              <span className="num">{s.costo > 0 ? pesos(s.costo) : ''}</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  )
}
