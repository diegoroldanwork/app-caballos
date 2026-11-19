'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useEscuela } from '@/lib/escuela'
import { traerCaballos, traerAlertas, importa, Caballo, Alerta } from '@/lib/datos'
import { TIPOS, ESTADO_ALERTA, textoVence } from '@/lib/formato'
import { Retrato } from '@/components/Retrato'
import { Pill } from '@/components/ui'
import { Cargando } from '@/components/Cargando'

const GRUPOS: { estado: Alerta['estado']; titulo: string }[] = [
  { estado: 'vencido', titulo: 'Vencidos' },
  { estado: 'por_vencer', titulo: 'Por vencer' },
  { estado: 'sin_registro', titulo: 'Nunca registrado' },
]
const FILTROS = ['todos', 'aie', 'vacuna', 'herraje'] as const

export default function Alertas() {
  const escuela = useEscuela()
  const [caballos, setCaballos] = useState<Caballo[] | null>(null)
  const [alertas, setAlertas] = useState<Alerta[]>([])
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number]>('todos')

  useEffect(() => {
    Promise.all([traerCaballos(escuela.id), traerAlertas(escuela.id)]).then(([c, a]) => { setCaballos(c); setAlertas(a) })
  }, [escuela.id])

  if (!caballos) return <Cargando />
  const porId = Object.fromEntries(caballos.map((c) => [c.id, c]))
  const visibles = alertas.filter((a) => filtro === 'todos' || a.tipo === filtro)
  const alDia = visibles.filter((a) => a.estado === 'al_dia').length

  return (
    <>
      <header className="cuero cabecera">
        <div className="eyebrow">Sanidad</div>
        <h1 style={{ marginTop: 6 }}>Libreta de la caballeriza</h1>
      </header>
      <div className="contenido">
        <div className="fila" style={{ gap: 6, justifyContent: 'flex-start', flexWrap: 'wrap' }}>
          {FILTROS.map((f) => (
            <button key={f} className={`btn btn-chico ${filtro === f ? 'btn-suela' : 'btn-sec'}`} onClick={() => setFiltro(f)}>
              {f === 'todos' ? 'Todo' : TIPOS[f].nombre}
            </button>
          ))}
        </div>
        <div key={filtro} className="entra">
          {GRUPOS.map((g) => {
            const items = visibles.filter((a) => a.estado === g.estado).sort((a, b) => (a.dias_restantes ?? -999) - (b.dias_restantes ?? -999))
            if (!items.length) return null
            return (
              <div key={g.estado}>
                <h2 className="fila">{g.titulo} <span className="sec">{items.length}</span></h2>
                <div className="diario">
                  {items.map((a) => (
                    <Link key={a.caballo_id + a.tipo} href={`/escuela/nuevo?caballo=${a.caballo_id}&tipo=${a.tipo}`}>
                      <Retrato nombre={a.caballo} foto={porId[a.caballo_id]?.foto_path} size={40} />
                      <div className="grow"><div><b className="titulo" style={{ fontSize: 18 }}>{a.caballo}</b> · {TIPOS[a.tipo]?.nombre}</div><div className="sec">{textoVence(a.dias_restantes, a.estado)}</div></div>
                      <Pill tono={importa(a) ? ESTADO_ALERTA[a.estado].tono : 'neutro'}>{ESTADO_ALERTA[a.estado].texto}</Pill>
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
          <p className="sec" style={{ textAlign: 'center', marginTop: 22 }}>{alDia} controles al día ✓</p>
        </div>
      </div>
    </>
  )
}
