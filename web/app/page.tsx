import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { Retrato } from '@/components/Retrato'

const DEMO = [
  { n: 'Duquesa', p: 'Tordillo', t: 'demo-duquesa', d: 'Vacuna vencida, sin AIE' },
  { n: 'Rayo', p: 'Alazán', t: 'demo-rayo', d: 'Vacuna por vencer' },
  { n: 'Pampa', p: 'Bayo', t: 'demo-pampa', d: 'Herraje y AIE vencidos' },
  { n: 'Morena', p: 'Zaino', t: 'demo-morena', d: 'Todo al día' },
  { n: 'Tango', p: 'Colorado', t: 'demo-tango', d: 'Herrado hace 5 días' },
  { n: 'Lucero', p: 'Tordillo', t: 'demo-lucero', d: 'Herraje por vencer' },
]

export default function Inicio() {
  return (
    <main className="app">
      <section className="cuero portada">
        <Logo size={38} claro />
        <h1>La carpeta de cada caballo, al día.</h1>
        <p>Herrador, veterinario, vacunas y la cuota de pensión. La escuela lo carga en segundos y el dueño lo ve en su celular.</p>
        <div className="manada" aria-hidden>
          {DEMO.map((c, i) => (
            <span key={c.t} style={{ animationDelay: `${0.15 + i * 0.12}s`, zIndex: 10 - i }}>
              <Retrato nombre={c.n} pelaje={c.p} size={64} fondo="#F3E6D3" />
            </span>
          ))}
        </div>
      </section>

      <div className="contenido entra" style={{ paddingTop: 22 }}>
        <Link href="/entrar" className="btn btn-suela" style={{ padding: 17, fontSize: 16 }}>Entrar como escuela</Link>
        <h2>O mirá la carpeta como dueño</h2>
        <div className="lista">
          {DEMO.slice(0, 4).map((c) => (
            <Link key={c.t} href={`/c/${c.t}`}>
              <Retrato nombre={c.n} pelaje={c.p} size={44} />
              <div className="grow"><div className="titulo" style={{ fontSize: 17 }}>{c.n}</div><div className="sec">{c.d}</div></div>
              <span className="sec">›</span>
            </Link>
          ))}
        </div>
        <p className="sec" style={{ marginTop: 18, textAlign: 'center' }}>Demo con datos ficticios · Escuela Ecuestre Los Aromos, Cañuelas</p>
      </div>
    </main>
  )
}
