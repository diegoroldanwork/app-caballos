'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from './supabase'
import { Cargando } from '@/components/Cargando'

export type Escuela = { id: string; nombre: string; localidad: string | null }
const Ctx = createContext<Escuela | null>(null)

export function EscuelaProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [escuela, setEscuela] = useState<Escuela | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return router.replace('/entrar')
      const { data, error } = await supabase
        .from('miembros_escuela')
        .select('escuelas(id, nombre, localidad)')
        .eq('user_id', session.user.id)
        .limit(1)
        .maybeSingle()
      if (error) return setError(error.message)
      const e = (data as any)?.escuelas
      if (!e) return setError('Tu usuario todavía no está asociado a ninguna escuela.')
      setEscuela(e)
    })()
  }, [router])

  if (error) return <div className="vacio">{error}</div>
  if (!escuela) return <Cargando />
  return <Ctx.Provider value={escuela}>{children}</Ctx.Provider>
}

export function useEscuela() {
  const e = useContext(Ctx)
  if (!e) throw new Error('useEscuela fuera de EscuelaProvider')
  return e
}
