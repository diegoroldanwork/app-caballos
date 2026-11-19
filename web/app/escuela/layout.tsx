'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { EscuelaProvider } from '@/lib/escuela'
import { Icono } from '@/components/Icono'

const ITEMS = [
  { href: '/escuela', n: 'casa', t: 'Inicio' },
  { href: '/escuela/caballos', n: 'caballo', t: 'Caballos' },
  { href: '/escuela/nuevo', n: 'mas', t: 'Cargar' },
  { href: '/escuela/alertas', n: 'campana', t: 'Sanidad' },
  { href: '/escuela/cobros', n: 'plata', t: 'Cobros' },
]

export default function EscuelaLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  const activo = (h: string) => (h === '/escuela' ? path === h : path.startsWith(h))
  return (
    <EscuelaProvider>
      <div className="app">{children}</div>
      <nav className="nav">
        <div className="nav-in">
          {ITEMS.map((i) =>
            i.n === 'mas' ? (
              <Link key={i.href} href={i.href} aria-current={activo(i.href) ? 'page' : undefined}>
                <span className="nav-mas"><Icono n="mas" size={28} /></span>{i.t}
              </Link>
            ) : (
              <Link key={i.href} href={i.href} aria-current={activo(i.href) ? 'page' : undefined}>
                <Icono n={i.n} />{i.t}
              </Link>
            )
          )}
        </div>
      </nav>
    </EscuelaProvider>
  )
}
