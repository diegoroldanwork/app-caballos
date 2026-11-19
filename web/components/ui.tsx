'use client'
import { ReactNode } from 'react'

/** Estado en versalitas con un punto de color (sin "pastillas"). */
export function Pill({ tono, children }: { tono: 'ok' | 'aviso' | 'mal' | 'neutro'; children: ReactNode }) {
  return <span className={`estado estado-${tono}`}>{children}</span>
}

export function vibrar(p: number | number[] = 30) {
  try { navigator.vibrate?.(p) } catch {}
}

export function fechaLarga(d = new Date()) {
  const s = d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
  return s.charAt(0).toUpperCase() + s.slice(1)
}
