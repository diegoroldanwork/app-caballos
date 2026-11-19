import Link from 'next/link'
import { Logo } from './Logo'

const CONTACTO = process.env.NEXT_PUBLIC_CONTACTO_WHATSAPP // ej. +5491112345678

/** Pie con la marca: cada carpeta que recibe un dueño es una presentación de Querencia. */
export function Firma() {
  return (
    <div className="firma">
      <Logo size={22} />
      <p>La libreta digital de cada caballo, para escuelas, haras y clubes.</p>
      {CONTACTO
        ? <a href={`https://wa.me/${CONTACTO.replace(/\D/g, '')}?text=${encodeURIComponent('Hola, quiero conocer Querencia para mi escuela')}`} target="_blank" rel="noreferrer">Quiero Querencia en mi escuela →</a>
        : <Link href="/">Conocé Querencia →</Link>}
    </div>
  )
}
