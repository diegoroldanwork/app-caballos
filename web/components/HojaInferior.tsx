'use client'
import { ReactNode, useRef, useState } from 'react'

/** Hoja que sube desde abajo; se cierra tocando afuera o deslizando hacia abajo. */
export function HojaInferior({ onCerrar, children }: { onCerrar: () => void; children: ReactNode }) {
  const y0 = useRef<number | null>(null)
  const [dy, setDy] = useState(0)
  return (
    <>
      <div className="velo" onClick={onCerrar} />
      <div className="hoja-inf" style={{ transform: dy ? `translateY(${dy}px)` : undefined, transition: dy ? 'none' : 'transform .2s' }}
        onTouchStart={(e) => { if ((e.currentTarget as HTMLElement).scrollTop <= 0) y0.current = e.touches[0].clientY }}
        onTouchMove={(e) => { if (y0.current != null) setDy(Math.max(0, e.touches[0].clientY - y0.current)) }}
        onTouchEnd={() => { if (dy > 110) onCerrar(); y0.current = null; setDy(0) }}>
        <div className="asa" />
        {children}
      </div>
    </>
  )
}
