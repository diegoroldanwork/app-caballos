'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Logo } from '@/components/Logo'

const DEMO_EMAIL = process.env.NEXT_PUBLIC_DEMO_EMAIL ?? ''
const DEMO_PASS = process.env.NEXT_PUBLIC_DEMO_PASSWORD ?? ''

export default function Entrar() {
  const router = useRouter()
  const [email, setEmail] = useState(DEMO_EMAIL)
  const [pass, setPass] = useState(DEMO_PASS)
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  async function entrar(e: React.FormEvent) {
    e.preventDefault()
    setCargando(true); setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass })
    setCargando(false)
    if (error) return setError('No pudimos entrar. Revisá el mail y la contraseña.')
    router.replace('/escuela')
  }

  return (
    <main className="app">
      <div className="contenido" style={{ paddingTop: 60 }}>
        <Logo size={40} />
        <h1 style={{ marginTop: 28 }}>Entrá a tu escuela</h1>
        <p className="sec" style={{ marginTop: 6 }}>Para la demo ya dejamos cargado el usuario de Los Aromos.</p>
        <form onSubmit={entrar} className="pila" style={{ marginTop: 24 }}>
          <label className="campo">Mail<input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
          <label className="campo">Contraseña<input className="input" type="password" value={pass} onChange={(e) => setPass(e.target.value)} required /></label>
          {error && <div className="alerta-banner">{error}</div>}
          <button className="btn" disabled={cargando} style={{ marginTop: 8 }}>{cargando ? 'Entrando…' : 'Entrar'}</button>
        </form>
      </div>
    </main>
  )
}
