'use client'
import { ReactNode, useEffect, useRef, useState } from 'react'

export function Pill({ tono, children }: { tono: 'ok' | 'aviso' | 'mal' | 'neutro'; children: ReactNode }) {
  return <span className={`pill pill-${tono}`}>{children}</span>
}

/** Número que "cuenta" hasta su valor (para montos y KPIs). */
export function Contador({ valor, formato = (n: number) => String(Math.round(n)), ms = 900 }:
  { valor: number; formato?: (n: number) => string; ms?: number }) {
  const [v, setV] = useState(0)
  const desde = useRef(0)
  useEffect(() => {
    const ini = performance.now(), a = desde.current
    let raf = 0
    const paso = (t: number) => {
      const k = Math.min(1, (t - ini) / ms)
      const e = 1 - Math.pow(1 - k, 3)
      setV(a + (valor - a) * e)
      if (k < 1) raf = requestAnimationFrame(paso)
      else desde.current = valor
    }
    raf = requestAnimationFrame(paso)
    return () => cancelAnimationFrame(raf)
  }, [valor, ms])
  return <>{formato(v)}</>
}

export function vibrar(p: number | number[] = 30) {
  try { navigator.vibrate?.(p) } catch {}
}
