import { MARCA } from '@/lib/marca'

/** Herradura de Tropilla. `tinta` = color de la herradura, `fondo` = color del sello. */
export function Isotipo({ size = 36, fondo = 'var(--suela)', tinta = 'var(--crudo)' }: { size?: number; fondo?: string; tinta?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <rect width="64" height="64" rx="16" fill={fondo} />
      <path d="M20 46V28a12 12 0 0 1 24 0v18" fill="none" stroke={tinta} strokeWidth="6" strokeLinecap="round" />
      <g fill={fondo}>
        <circle cx="20" cy="34" r="1.8" /><circle cx="44" cy="34" r="1.8" />
        <circle cx="20" cy="40" r="1.6" /><circle cx="44" cy="40" r="1.6" />
      </g>
    </svg>
  )
}

export function Logo({ size = 32, claro = false }: { size?: number; claro?: boolean }) {
  return (
    <span className="logo">
      <Isotipo size={size} fondo={claro ? 'var(--crudo)' : 'var(--suela)'} tinta={claro ? 'var(--suela)' : 'var(--crudo)'} />
      <span className="logo-texto" style={{ fontSize: size * 0.82 }}>{MARCA}</span>
    </span>
  )
}
