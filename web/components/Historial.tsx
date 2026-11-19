'use client'
import { useState } from 'react'
import { fotoUrl } from '@/lib/supabase'
import { TIPOS, pesos, fechaCorta, hace } from '@/lib/formato'
import { Icono } from './Icono'

type S = { id?: string; fecha: string; tipo: string; descripcion: string | null; profesional: string | null; costo: number; foto_path: string | null }

/** Línea de tiempo de servicios, con fotos que se abren a pantalla completa. */
export function Historial({ servicios, nuevo }: { servicios: S[]; nuevo?: string | null }) {
  const [visor, setVisor] = useState<string | null>(null)
  if (!servicios.length) return <div className="vacio">Todavía no hay servicios cargados.</div>
  return (
    <div className="linea-tiempo entra">
      {servicios.map((s, i) => {
        const url = fotoUrl(s.foto_path)
        return (
          <div key={s.id ?? i} className={`evento ${nuevo && s.id === nuevo ? 'sacude' : ''}`}>
            <span className="bolita"><Icono n={TIPOS[s.tipo]?.icono} size={11} /></span>
            <div className="tarjeta">
              <div className="fila">
                <b>{TIPOS[s.tipo]?.nombre ?? s.tipo}</b>
                {Number(s.costo) > 0 && <span className="num">{pesos(s.costo)}</span>}
              </div>
              {s.descripcion && <div style={{ marginTop: 2 }}>{s.descripcion}</div>}
              <div className="sec" style={{ marginTop: 4 }}>{fechaCorta(s.fecha)} · {hace(s.fecha)}{s.profesional ? ` · ${s.profesional}` : ''}</div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {url && <img className="foto" src={url} alt={`Foto de ${s.tipo}`} onClick={() => setVisor(url)} />}
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
