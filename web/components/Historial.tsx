'use client'
import { useState } from 'react'
import { fotoUrl } from '@/lib/supabase'
import { TIPOS, pesos } from '@/lib/formato'

type S = { id?: string; fecha: string; tipo: string; descripcion: string | null; profesional: string | null; costo: number; foto_path: string | null }

function fechaCol(d: string) {
  const [y, m, dd] = d.slice(0, 10).split('-').map(Number)
  const f = new Date(y, m - 1, dd)
  return { dia: f.getDate(), mes: f.toLocaleDateString('es-AR', { month: 'short' }).replace('.', '') }
}

/** Historial como un diario: fecha a la izquierda, registro a la derecha. */
export function Historial({ servicios, nuevo }: { servicios: S[]; nuevo?: string | null }) {
  const [visor, setVisor] = useState<string | null>(null)
  if (!servicios.length) return <div className="vacio">Todavía no hay registros.</div>
  return (
    <div className="historial entra">
      {servicios.map((s, i) => {
        const url = fotoUrl(s.foto_path)
        const f = fechaCol(s.fecha)
        return (
          <div key={s.id ?? i} className={`registro ${nuevo && s.id === nuevo ? 'sacude' : ''}`}>
            <div className="registro-fecha"><b>{f.dia}</b><span>{f.mes}</span></div>
            <div className="registro-cuerpo">
              <div className="fila" style={{ alignItems: 'baseline' }}>
                <span className="titulo" style={{ fontSize: 19 }}>{TIPOS[s.tipo]?.nombre ?? s.tipo}</span>
                {Number(s.costo) > 0 && <span className="num-fino">{pesos(s.costo)}</span>}
              </div>
              {s.descripcion && <div>{s.descripcion}</div>}
              {s.profesional && <div className="sec">{s.profesional}</div>}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {url && <img className="foto-registro" src={url} alt={`Foto de ${s.tipo}`} onClick={() => setVisor(url)} />}
            </div>
          </div>
        )
      })}
      {visor && (
        // eslint-disable-next-line @next/next/no-img-element
        <div className="visor" onClick={() => setVisor(null)}><img src={visor} alt="" /></div>
      )}
    </div>
  )
}
