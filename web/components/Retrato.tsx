// Retrato ilustrado del caballo, pintado con su pelaje real.
// Así cada caballo tiene "cara" aunque todavía no tenga foto.
import { fotoUrl } from '@/lib/supabase'

const PELAJES: Record<string, { cuerpo: string; crin: string; tordillo?: boolean }> = {
  zaino: { cuerpo: '#4A2E1C', crin: '#1A110B' },
  alazan: { cuerpo: '#A4532A', crin: '#7A3A18' },
  colorado: { cuerpo: '#8E3B1F', crin: '#2A1710' },
  bayo: { cuerpo: '#D2A866', crin: '#2C1F14' },
  tordillo: { cuerpo: '#BDBAB2', crin: '#8D897F', tordillo: true },
  moro: { cuerpo: '#6F6E6E', crin: '#262322' },
  oscuro: { cuerpo: '#2A2420', crin: '#0E0B09' },
  overo: { cuerpo: '#B07A4A', crin: '#3A2618' },
  rosillo: { cuerpo: '#A97A6A', crin: '#4A3028' },
  gateado: { cuerpo: '#B99363', crin: '#2C1F14' },
}

const sinTilde = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const hash = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7)

export function Retrato({ nombre, pelaje, foto, size = 56, fondo = 'var(--crudo)' }:
  { nombre: string; pelaje?: string | null; foto?: string | null; size?: number; fondo?: string }) {
  const url = fotoUrl(foto)
  if (url)
    // eslint-disable-next-line @next/next/no-img-element
    return <img className="retrato" src={url} alt={nombre} style={{ width: size, height: size }} />

  const p = PELAJES[sinTilde(pelaje ?? '').split(' ')[0]] ?? PELAJES.zaino
  const h = hash(nombre)
  const lucero = sinTilde(nombre) === 'lucero' || h % 3 === 0
  const id = `r${h}`
  return (
    <svg className="retrato" width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={nombre}>
      <defs>
        <clipPath id={`${id}c`}><circle cx="50" cy="50" r="50" /></clipPath>
        {p.tordillo && (
          <pattern id={`${id}p`} width="14" height="13" patternUnits="userSpaceOnUse" patternTransform="rotate(18)">
            <circle cx="3" cy="3" r="2.4" fill="#fff" opacity=".28" />
            <circle cx="10" cy="5" r="1.6" fill="#fff" opacity=".22" />
            <circle cx="6" cy="10" r="2" fill="#5E5A52" opacity=".14" />
          </pattern>
        )}
      </defs>
      <g clipPath={`url(#${id}c)`}>
        <rect width="100" height="100" fill={fondo} />
        <circle cx={20 + (h % 50)} cy="18" r="40" fill="#fff" opacity=".18" />
        <g transform={`rotate(${(h % 7) - 3} 60 70)`}>
          <path d="M54 3 C57 8 60 12 61 17 C73 25 85 40 91 58 C95 72 96 86 97 100 L46 100 C47 90 49 80 52 74 C52 70 50 72 44 74 C36 77 28 82 22 84 C16 86 11 82 11 77 C11 72 12 68 13 64 C18 50 26 34 36 24 C40 20 44 16 47 14 L49 7 L51 13 C52 9 53 6 54 3Z" fill={p.cuerpo} />
          {p.tordillo && <path d="M54 3 C57 8 60 12 61 17 C73 25 85 40 91 58 C95 72 96 86 97 100 L46 100 C47 90 49 80 52 74 C52 70 50 72 44 74 C36 77 28 82 22 84 C16 86 11 82 11 77 C11 72 12 68 13 64 C18 50 26 34 36 24 C40 20 44 16 47 14 L49 7 L51 13 C52 9 53 6 54 3Z" fill={`url(#${id}p)`} />}
          <path d="M58 11 C70 17 82 30 88 46 C93 60 95 78 96 100 L89 100 C89 82 87 66 82 53 C77 40 70 29 60 21 C61 18 60 14 58 11Z" fill={p.crin} />
          <path d="M45 15 C40 18 39 25 45 26 C47 24 49 19 45 15Z" fill={p.crin} />
          {lucero && <path d="M32 26 L36 31 L30 34 Z" fill="#fff" />}
          <ellipse cx="37" cy="33" rx="2.6" ry="2" fill="#120c08" transform="rotate(-35 37 33)" />
          <circle cx="36.3" cy="32.3" r=".7" fill="#fff" />
          <ellipse cx="15.5" cy="70" rx="2.4" ry="1.3" fill="#120c08" opacity=".55" transform="rotate(-60 15.5 70)" />
          <path d="M13 79 C17 80 20 80 23 79" stroke="#120c08" strokeOpacity=".3" fill="none" />
          <path d="M50 74 C44 64 40 56 39 46" stroke="#000" strokeOpacity=".12" strokeWidth="2" fill="none" />
        </g>
      </g>
    </svg>
  )
}
