'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useEscuela } from '@/lib/escuela'
import { traerCaballos, traerAlertas, peorPorCaballo, COLOR_ESTADO, Caballo, Alerta } from '@/lib/datos'
import { Foto } from '@/components/Foto'
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
  const peor = peorPorCaballo(alertas)
  const filtro = q.trim().toLowerCase()
  const lista = caballos.filter((c) => !filtro || `${c.nombre} ${c.duenos?.nombre} ${c.pelaje} ${c.raza}`.toLowerCase().includes(filtro))

  return (
    <>
      <header className="cuero cabecera">
        <div className="eyebrow">Caballeriza</div>
        <h1 style={{ marginTop: 6 }}>{caballos.length} caballos en pensión</h1>
      </header>
      <div className="contenido">
        <input className="input" placeholder="Buscar por caballo, dueño o pelaje" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="galeria galeria-grilla entra" style={{ marginTop: 16 }}>
          {lista.map((c) => (
            <Link key={c.id} href={`/escuela/caballos/${c.id}`} className="cuadro">
              <Foto nombre={c.nombre} foto={c.foto_path} />
              <span className="cuadro-pie">
                <span className="punto" style={{ background: COLOR_ESTADO[peor[c.id] ?? 'al_dia'] }} />
                <b>{c.nombre}</b>
                <small>{c.raza} · {c.pelaje}</small>
                <small>{c.duenos?.nombre}</small>
              </span>
            </Link>
          ))}
        </div>
        {!lista.length && <div className="vacio">No encontramos ningún caballo con “{q}”.</div>}
      </div>
    </>
  )
}
