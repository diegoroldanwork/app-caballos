'use client'
import { useState } from 'react'
import { fotoUrl } from '@/lib/supabase'

const sinTilde = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

// Fotos de la demo (Unsplash, licencia libre). Las reemplaza la foto que suba la escuela.
const U = (id: string) => `https://images.unsplash.com/photo-${id}?w=1200&q=75&auto=format&fit=crop`
const DEMO: Record<string, string> = {
  portada: U('1463748465553-80db1e6ff830'),
  duquesa: U('1650735973119-f5b0fb72aa02'),
  lucero: U('1553284965-83fd3e82fa5a'),
  morena: U('1604429287879-6bc7a7572048'),
  rayo: U('1593179449458-e0d43d512551'),
  tango: U('1545780699-605328d5e41b'),
  pampa: U('1563443803769-a5c44bd91e39'),
}

/** Foto del caballo: la que subió la escuela; si no, la de la demo o /public/caballos/<nombre>.jpg. */
export function srcCaballo(nombre: string, foto?: string | null) {
  const n = sinTilde(nombre)
  return fotoUrl(foto) ?? DEMO[n] ?? `/caballos/${n}.jpg`
}

/** Imagen con un fondo oscuro de respaldo mientras carga (o si falta). */
export function Foto({ nombre, foto, className = '', style, posicion = 'center 30%' }:
  { nombre: string; foto?: string | null; className?: string; style?: React.CSSProperties; posicion?: string }) {
  const [ok, setOk] = useState(true)
  const [cargada, setCargada] = useState(false)
  return (
    <span className={`foto ${className}`} style={style}>
      {ok && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={srcCaballo(nombre, foto)} alt={nombre} style={{ objectPosition: posicion, opacity: cargada ? 1 : 0 }}
          onLoad={() => setCargada(true)} onError={() => setOk(false)} />
      )}
      {!ok && <span className="foto-letra">{nombre.charAt(0)}</span>}
    </span>
  )
}
