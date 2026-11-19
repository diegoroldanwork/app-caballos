'use client'
import { useEffect, useRef } from 'react'
import { vibrar } from './ui'

/** Sello de herradura que "marca" la pantalla, como un sello de cuero. */
export function Sello({ texto, sub, color = 'var(--suela)', onFin, ms = 1700 }:
  { texto: string; sub?: string; color?: string; onFin?: () => void; ms?: number }) {
  const fin = useRef(onFin)
  fin.current = onFin
  useEffect(() => {
    const t1 = setTimeout(() => vibrar([18, 40, 60]), 380)
    const t2 = setTimeout(() => fin.current?.(), ms)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [ms])

  return (
    <div className="sello-capa" onClick={() => fin.current?.()}>
      <div className="sello" style={{ color }}>
        <svg viewBox="0 0 200 200" width="220" height="220" aria-hidden>
          <defs>
            <path id="arco" d="M100 100 m-74 0 a74 74 0 1 1 148 0" />
            <filter id="tinta"><feTurbulence baseFrequency=".9" numOctaves="2" seed="3" /><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.6 1.25" /><feComposite in="SourceGraphic" operator="in" /></filter>
          </defs>
          <g filter="url(#tinta)" fill="none" stroke="currentColor">
            <circle cx="100" cy="100" r="92" strokeWidth="5" />
            <circle cx="100" cy="100" r="84" strokeWidth="1.5" />
            <path d="M70 140V96a30 30 0 0 1 60 0v44" strokeWidth="13" strokeLinecap="round" />
            <text fill="currentColor" stroke="none" fontSize="17" fontWeight="700" letterSpacing="5" fontFamily="var(--f-texto)">
              <textPath href="#arco" startOffset="50%" textAnchor="middle">{texto.toUpperCase()}</textPath>
            </text>
          </g>
        </svg>
        {sub && <div className="sello-sub">{sub}</div>}
      </div>
    </div>
  )
}
