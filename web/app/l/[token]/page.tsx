'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ESTADO_LIQ, pesos, mes, fechaCorta } from '@/lib/formato'
import { Logo } from '@/components/Logo'
import { Icono } from '@/components/Icono'
import { Pill, Contador, vibrar } from '@/components/ui'
import { Sello } from '@/components/Sello'
import { HojaInferior } from '@/components/HojaInferior'
import { Cargando } from '@/components/Cargando'

type Liq = {
  escuela: { nombre: string; telefono: string | null; mp_alias: string | null }
  dueno: string; periodo: string; estado: string; total: number; pagado: number; saldo: number
  vence_el: string | null; items: { tipo: string; concepto: string; monto: number }[]
}

const MEDIOS = [
  { id: 'cuenta', t: 'Dinero disponible', s: 'Saldo en tu cuenta' },
  { id: 'debito', t: 'Débito terminada en 4242', s: 'Banco de prueba' },
  { id: 'credito', t: 'Crédito terminada en 1111', s: 'Hasta 3 cuotas sin interés' },
]

export default function LiquidacionDueno() {
  const { token } = useParams<{ token: string }>()
  const router = useRouter()
  const [l, setL] = useState<Liq | null | undefined>(undefined)
  const [checkout, setCheckout] = useState(false)
  const [medio, setMedio] = useState('cuenta')
  const [paso, setPaso] = useState<'elegir' | 'procesando'>('elegir')
  const [sello, setSello] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.rpc('liquidacion_publica', { p_token: token }).then(({ data }) => setL((data as Liq) ?? null))
  }, [token])

  async function pagar() {
    setPaso('procesando'); setError(null)
    const [{ data, error }] = await Promise.all([
      supabase.rpc('simular_pago_mp', { p_token: token }),
      new Promise((r) => setTimeout(r, 1600)),
    ])
    if (error) { setError(error.message); setPaso('elegir'); return }
    setCheckout(false); setPaso('elegir')
    setSello(true); setL(data as Liq)
  }

  if (l === undefined) return <Cargando />
  if (l === null) return <div className="app vacio"><Logo /><p style={{ marginTop: 20 }}>Este link de pago no es válido.</p></div>

  const pagada = l.estado === 'pagada'
  const items = [...l.items].sort((a, b) => (a.tipo === 'pension' ? -1 : 1) - (b.tipo === 'pension' ? -1 : 1))

  return (
    <main className="app">
      <header className="cuero cabecera" style={{ paddingBottom: 34 }}>
        <div className="cabecera-top">
          <button className="volver" style={{ background: 'none', border: 0, color: 'inherit' }} onClick={() => router.back()}><Icono n="flecha" size={18} />Volver</button>
          <Pill tono={ESTADO_LIQ[l.estado].tono}>{ESTADO_LIQ[l.estado].texto}</Pill>
        </div>
        <div className="sec">{l.escuela.nombre}</div>
        <h1 style={{ marginTop: 4 }}>Cuota de {mes(l.periodo).split(' ')[0].toLowerCase()}</h1>
        <div className="sec" style={{ marginTop: 4 }}>{l.dueno} · {mes(l.periodo).split(' ').pop()}{l.vence_el ? ` · vence el ${fechaCorta(l.vence_el)}` : ''}</div>
      </header>

      <div className="contenido entra">
        <div className="saldo" style={pagada ? { background: 'var(--cuero), linear-gradient(160deg,#8A4723,var(--suela))' } : undefined}>
          <div className="sec">{pagada ? '¡Gracias! Está todo pago' : 'Saldo a pagar'}</div>
          <div className="monto"><Contador valor={pagada ? Number(l.total) : Number(l.saldo)} formato={pesos} /></div>
          {pagada && <span className="sello-mini">Pagado</span>}
          {pagada
            ? <div className="fila" style={{ justifyContent: 'flex-start', gap: 8, fontWeight: 600 }}><Icono n="check" />Pago acreditado</div>
            : <button className="btn btn-mp" onClick={() => { setCheckout(true); vibrar(10) }}>Pagar con Mercado Pago</button>}
        </div>

        <h2>Detalle</h2>
        <div className="lista">
          {items.map((i, k) => (
            <div key={k}><div className="grow"><div style={{ fontWeight: 500 }}>{i.concepto}</div><div className="sec">{i.tipo === 'pension' ? 'Pensión' : i.tipo === 'extra' ? 'Extra' : 'Ajuste'}</div></div><span className="num">{pesos(i.monto)}</span></div>
          ))}
          <div><div className="grow"><b>Total</b></div><span className="num titulo" style={{ fontSize: 20 }}>{pesos(l.total)}</span></div>
          {Number(l.pagado) > 0 && <div><div className="grow">Pagado</div><span className="num" style={{ color: 'var(--oliva)' }}>− {pesos(l.pagado)}</span></div>}
        </div>

        <div className="pie"><span>Cobro hecho con</span><Logo size={22} /></div>
      </div>

      {checkout && (
        <HojaInferior onCerrar={() => paso === 'elegir' && setCheckout(false)}>
          {paso === 'elegir' ? (
            <>
              <div className="fila"><b style={{ color: '#009EE3', fontSize: 17 }}>Mercado Pago</b><span className="pill pill-neutro">Demo · pago simulado</span></div>
              <div className="sec" style={{ marginTop: 10 }}>Pagás a {l.escuela.nombre}</div>
              <div className="titulo" style={{ fontSize: 32, margin: '2px 0 16px' }}>{pesos(l.saldo)}</div>
              <div className="lista">
                {MEDIOS.map((m) => (
                  <label key={m.id} style={{ cursor: 'pointer' }}>
                    <input type="radio" name="medio" checked={medio === m.id} onChange={() => setMedio(m.id)} style={{ width: 20, height: 20, accentColor: '#009EE3' }} />
                    <div className="grow"><div>{m.t}</div><div className="sec">{m.s}</div></div>
                  </label>
                ))}
              </div>
              {error && <div className="alerta-banner" style={{ marginTop: 12 }}>{error}</div>}
              <button className="btn btn-mp" style={{ marginTop: 16, padding: 16 }} onClick={pagar}>Pagar {pesos(l.saldo)}</button>
              <p className="sec" style={{ textAlign: 'center', marginTop: 10 }}>En la demo no se mueve plata real.</p>
            </>
          ) : (
            <div style={{ padding: '40px 0', textAlign: 'center' }}>
              <div className="spinner" />
              <div className="titulo" style={{ fontSize: 20, marginTop: 18 }}>Procesando el pago…</div>
              <div className="sec">No cierres esta pantalla</div>
            </div>
          )}
        </HojaInferior>
      )}

      {sello && <Sello texto="Pagado" sub={`Gracias, ${l.dueno.split(' ')[0]}`} color="var(--oliva)" onFin={() => setSello(false)} ms={2000} />}
    </main>
  )
}
