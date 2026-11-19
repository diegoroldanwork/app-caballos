import { TIPOS, ESTADO_ALERTA, textoVence } from '@/lib/formato'
import { COLOR_ESTADO } from '@/lib/datos'
import { Pill } from './ui'
import Link from 'next/link'

type A = { tipo: string; estado: string; dias_restantes: number | null; vence_el?: string | null }
const VALIDEZ: Record<string, number> = { aie: 60, vacuna: 180, herraje: 45, desparasitacion: 90, odontologia: 365 }

/** Tarjetas de sanidad con una barrita que muestra cuánto falta para el vencimiento. */
export function Sanidad({ alertas, linkCargar }: { alertas: A[]; linkCargar?: (tipo: string) => string }) {
  const orden = ['aie', 'vacuna', 'herraje', 'desparasitacion', 'odontologia']
  const lista = [...alertas].sort((a, b) => orden.indexOf(a.tipo) - orden.indexOf(b.tipo))
  return (
    <div className="sanidad-grid entra">
      {lista.map((a) => {
        const e = ESTADO_ALERTA[a.estado]
        const total = VALIDEZ[a.tipo] ?? 90
        const resto = a.dias_restantes == null ? 0 : Math.max(0, Math.min(1, a.dias_restantes / total))
        const cont = (
          <div className="tarjeta" style={{ height: '100%' }}>
            <div className="titulo" style={{ fontSize: 17 }}>{TIPOS[a.tipo]?.nombre}</div>
            <div className="sec" style={{ margin: '2px 0 8px' }}>{textoVence(a.dias_restantes, a.estado)}</div>
            <Pill tono={e.tono}>{e.texto}</Pill>
            <div className="medidor"><div style={{ width: `${Math.max(resto * 100, 4)}%`, background: COLOR_ESTADO[a.estado] }} /></div>
          </div>
        )
        return linkCargar && a.estado !== 'al_dia'
          ? <Link key={a.tipo} href={linkCargar(a.tipo)}>{cont}</Link>
          : <div key={a.tipo}>{cont}</div>
      })}
    </div>
  )
}
