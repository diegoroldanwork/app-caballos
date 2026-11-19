'use client'
import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Icono } from './Icono'

const SIN_VOLVER = ['/', '/escuela', '/entrar']

/** Botón de volver flotante, siempre visible al scrollear, con efecto vidrio. */
export function Volver() {
  const path = usePathname()
  const router = useRouter()
  const visible = !SIN_VOLVER.includes(path)

  useEffect(() => {
    document.body.classList.toggle('con-volver', visible)
  }, [visible])

  if (!visible) return null
  function volver() {
    if (window.history.length > 1) router.back()
    else router.push(path.split('/').slice(0, -1).join('/') || '/')
  }
  return (
    <button className="vidrio volver-flotante" onClick={volver} aria-label="Volver">
      <Icono n="flecha" size={20} />
    </button>
  )
}
