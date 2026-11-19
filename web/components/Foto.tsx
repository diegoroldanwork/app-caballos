'use client'
import { useState } from 'react'
import { fotoUrl } from '@/lib/supabase'

const sinTilde = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/** Foto del caballo: la que subió la escuela, o la de la demo en /public/caballos/<nombre>.jpg. */
export function srcCaballo(nombre: string, foto?: string | null) {
  return fotoUrl(foto) ?? `/caballos/${sinTilde(nombre)}.jpg`
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
