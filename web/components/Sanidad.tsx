import Link from 'next/link'
import { TIPOS, ESTADO_ALERTA, fechaCorta } from '@/lib/formato'
import { Pill } from './ui'

type A = { tipo: string; estado: string; dias_restantes: number | null; vence_el?: string | null; ultima_fecha?: string | null }
const ORDEN = ['aie', 'vacuna', 'herraje', 'desparasitacion', 'odontologia']

/** Libreta sanitaria: una fila por control, como una planilla. */
export function Sanidad({ alertas, linkCargar }: { alertas: A[]; linkCargar?: (tipo: string) => string }) {
  const lista = [...alertas].sort((a, b) => ORDEN.indexOf(a.tipo) - ORDEN.indexOf(b.tipo))
  return (
    <div className="libreta entra">
      <div className="libreta-cab"><span>Control</span><span>Último</span><span>Vence</span><span /></div>
      {lista.map((a) => {
        const e = ESTADO_ALERTA[a.estado]
        const fila = (
          <>
            <span className="titulo">{TIPOS[a.tipo]?.nombre}</span>
            <span className="num-fino">{a.ultima_fecha ? fechaCorta(a.ultima_fecha) : '—'}</span>
            <span className="num-fino">{a.vence_el ? fechaCorta(a.vence_el) : '—'}</span>
            <Pill tono={e.tono}>{e.texto}</Pill>
          </>
        )
        return linkCargar && a.estado !== 'al_dia'
          ? <Link key={a.tipo} href={linkCargar(a.tipo)} className="libreta-fila">{fila}</Link>
          : <div key={a.tipo} className="libreta-fila">{fila}</div>
      })}
    </div>
  )
}
