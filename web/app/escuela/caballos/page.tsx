'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useEscuela } from '@/lib/escuela'
import { traerCaballos, traerAlertas, importa, Caballo, Alerta } from '@/lib/datos'
import { Retrato } from '@/components/Retrato'
import { Pill } from '@/components/ui'
import { Cargando } from '@/components/Cargando'

export default function Caballos() {
  const escuela = useEscuela()
  const [caballos, setCaballos] = useState<Caballo[] | null>(null)
  const [alertas, setAlertas] = useState<Alerta[]>([])
  const [q, setQ] = useState('')

  useEffect(() => {
    Promise.all([traerCaballos(escuela.id), traerAlertas(escuela.id)]).then(([c, a]) => { setCaballos(c); setAlertas(a) })
  }, [escuela.id])

  if (!caballos) return <Cargando />
  const filtro = q.trim().toLowerCase()
  const lista = caballos.filter((c) => !filtro || `${c.nombre} ${c.duenos?.nombre} ${c.pelaje} ${c.raza}`.toLowerCase().includes(filtro))

  return (
    <>
      <header className="cuero cabecera">
        <h1>Caballos</h1>
        <p className="sec" style={{ marginTop: 4 }}>{caballos.length} en pensión</p>
      </header>
      <div className="contenido entra">
        <input className="input" placeholder="Buscar por caballo, dueño o pelaje" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="lista" style={{ marginTop: 12 }}>
          {lista.map((c) => {
            const mal = alertas.filter((a) => a.caballo_id === c.id && importa(a) && a.estado !== 'por_vencer').length
            const aviso = alertas.filter((a) => a.caballo_id === c.id && a.estado === 'por_vencer').length
            return (
              <Link key={c.id} href={`/escuela/caballos/${c.id}`}>
                <Retrato nombre={c.nombre} pelaje={c.pelaje} foto={c.foto_path} size={52} />
                <div className="grow">
                  <div className="titulo" style={{ fontSize: 18 }}>{c.nombre}</div>
                  <div className="sec">{c.raza} · {c.pelaje} · {c.duenos?.nombre}</div>
                </div>
                {mal ? <Pill tono="mal">{mal}</Pill> : aviso ? <Pill tono="aviso">{aviso}</Pill> : <Pill tono="ok">OK</Pill>}
              </Link>
            )
          })}
        </div>
        {!lista.length && <div className="vacio">No encontramos ningún caballo con “{q}”.</div>}
      </div>
    </>
  )
}
