import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { Foto } from '@/components/Foto'
import { Firma } from '@/components/Firma'
import { MARCA } from '@/lib/marca'

const DEMO = [
  { n: 'Duquesa', t: 'demo-duquesa', d: 'Árabe · tordilla' },
  { n: 'Rayo', t: 'demo-rayo', d: 'Polo Argentino · alazán' },
  { n: 'Morena', t: 'demo-morena', d: 'Silla Argentino · zaina' },
  { n: 'Pampa', t: 'demo-pampa', d: 'Criolla · baya' },
]

export default function Inicio() {
  return (
    <main className="app">
      <header className="portada-caballo alta" style={{ height: '86dvh', maxHeight: 820 }}>
        <Foto nombre="portada" className="portada-foto" />
        <div className="portada-velo portada-velo-fuerte" />
        <div className="portada-top"><Logo size={26} claro /></div>
        <div className="portada-texto">
          <h1 className="bienvenida-titulo">La libreta digital de los caballos,<br /><em>el control total de las caballerizas.</em></h1>
          <p className="bienvenida-sub">Todo en {MARCA}.</p>
          <Link href="/entrar" className="btn" style={{ marginTop: 22, background: 'var(--hueso)', color: 'var(--tinta)' }}>Ingresar como escuela</Link>
        </div>
      </header>

      <div className="contenido" style={{ paddingTop: 30 }}>
        <div className="eyebrow" style={{ color: 'var(--oro)' }}>Carpetas de ejemplo</div>
        <h2 style={{ marginTop: 8 }}>Lo que ve el dueño del caballo</h2>
        <div className="galeria">
          {DEMO.map((c) => (
            <Link key={c.t} href={`/c/${c.t}`} className="cuadro">
              <Foto nombre={c.n} />
              <span className="cuadro-pie"><b>{c.n}</b><small>{c.d}</small></span>
            </Link>
          ))}
        </div>
        <p className="sec" style={{ marginTop: 14, fontSize: 12 }}>Datos ficticios de la Escuela Ecuestre Los Aromos, Cañuelas.</p>
        <Firma />
      </div>
    </main>
  )
}
