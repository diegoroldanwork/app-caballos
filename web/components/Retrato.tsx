'use client'
import { Foto } from './Foto'

/** Retrato redondo del caballo (foto real; si falta, su inicial). */
export function Retrato({ nombre, foto, size = 56 }:
  { nombre: string; pelaje?: string | null; foto?: string | null; size?: number }) {
  return <Foto nombre={nombre} foto={foto} className="retrato" style={{ width: size, height: size, fontSize: size * 0.42 }} />
}
