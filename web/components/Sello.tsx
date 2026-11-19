'use client'
import { useEffect, useRef } from 'react'
import { vibrar } from './ui'

/** Confirmación sobria: un círculo que se dibuja con un tilde, y el detalle. */
export function Sello({ texto, sub, onFin, ms = 1600 }:
  { texto: string; sub?: string; color?: string; onFin?: () => void; ms?: number }) {
  const fin = useRef(onFin)
  fin.current = onFin
  useEffect(() => {
    const t1 = setTimeout(() => vibrar(20), 450)
    const t2 = setTimeout(() => fin.current?.(), ms)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [ms])

  return (
    <div className="confirma-capa" onClick={() => fin.current?.()}>
      <div className="confirma">
        <svg viewBox="0 0 64 64" width="76" height="76" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <circle className="traza-circulo" cx="32" cy="32" r="30" />
          <path className="traza-tilde" d="M21 33l7.5 7.5L44 25" strokeWidth="2.2" />
        </svg>
        <div className="confirma-titulo">{texto}</div>
        {sub && <div className="confirma-sub">{sub}</div>}
      </div>
    </div>
  )
}
