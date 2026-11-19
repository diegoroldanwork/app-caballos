import { MARCA } from '@/lib/marca'

/** Sello de Querencia: una Q de trazo clásico dentro de un anillo fino, como una marca de estancia. */
export function Isotipo({ size = 32, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden fill="none" stroke={color}>
      <circle cx="24" cy="24" r="22.5" strokeWidth="1" />
      <circle cx="24" cy="24" r="20" strokeWidth=".5" opacity=".6" />
      <text x="24" y="31.5" textAnchor="middle" fill={color} stroke="none"
        style={{ fontFamily: 'var(--f-titulo)', fontSize: 25, fontWeight: 500, fontStyle: 'italic' }}>Q</text>
    </svg>
  )
}

export function Logo({ size = 26, claro = false }: { size?: number; claro?: boolean }) {
  return (
    <span className="logo" style={{ color: claro ? 'var(--hueso)' : 'var(--tinta)' }}>
      <Isotipo size={size} color={claro ? 'var(--oro)' : 'var(--suela)'} />
      <span className="logo-texto" style={{ fontSize: Math.round(size * 0.58) }}>{MARCA.toUpperCase()}</span>
    </span>
  )
}
