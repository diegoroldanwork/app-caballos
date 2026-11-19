'use client'
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useEscuela } from '@/lib/escuela'
import { linkWhatsApp, origen } from '@/lib/datos'
import { ESTADO_LIQ, pesos, mes, fechaCorta } from '@/lib/formato'
import { Icono } from '@/components/Icono'
import { Pill, vibrar } from '@/components/ui'
import { Sello } from '@/components/Sello'
import { HojaInferior } from '@/components/HojaInferior'
import { Cargando } from '@/components/Cargando'

type Item = { id: string; tipo: string; concepto: string; monto: number }
type Liq = {
  id: string; periodo: string; estado: string; total: number; pagado: number; token_publico: string
  fecha_vencimiento: string | null; duenos: { nombre: string; telefono: string | null } | null
  liquidacion_items: Item[]; pagos: { metodo: string; monto: number; estado: string; pagado_el: string | null }[]
}

type CobroAlumno = {
  id: string; periodo: string; concepto: string; monto: number; pagado: number; vence_el: string | null
  alumnos: { nombre: string; telefono: string | null } | null
}
const estadoAlumno = (c: CobroAlumno) =>
  Number(c.pagado) >= Number(c.monto) ? 'pagada' : c.vence_el && c.vence_el < new Date().toISOString().slice(0, 10) ? 'vencida' : 'emitida'

const primeroDeMes = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01` }

export default function Cobros() {
  const escuela = useEscuela()
  const [liqs, setLiqs] = useState<Liq[] | null>(null)
  const [alumnos, setAlumnos] = useState<CobroAlumno[] | null>(null)
  const [vista, setVista] = useState<'propietarios' | 'alumnos'>('propietarios')
  const [alumnoAbierto, setAlumnoAbierto] = useState<string | null>(null)
  const [abierta, setAbierta] = useState<string | null>(null)
  const [sello, setSello] = useState<{ texto: string; sub: string } | null>(null)
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    const { data } = await supabase.from('liquidaciones')
      .select('id, periodo, estado, total, pagado, token_publico, fecha_vencimiento, duenos(nombre, telefono), liquidacion_items(id, tipo, concepto, monto), pagos(metodo, monto, estado, pagado_el)')
      .eq('escuela_id', escuela.id).neq('estado', 'anulada').order('periodo', { ascending: false })
    setLiqs((data ?? []) as unknown as Liq[])
    const r = await supabase.from('cobros_alumnos')
      .select('id, periodo, concepto, monto, pagado, vence_el, alumnos(nombre, telefono)')
      .eq('escuela_id', escuela.id).order('periodo', { ascending: false }).order('created_at')
    setAlumnos(r.error ? [] : ((r.data ?? []) as unknown as CobroAlumno[]))
  }, [escuela.id])
  useEffect(() => { cargar() }, [cargar])

  async function correr(fn: () => PromiseLike<{ error: any }>, s: { texto: string; sub: string }) {
    setOcupado(true); setError(null)
    const { error } = await fn()
    setOcupado(false)
    if (error) return setError(error.message)
    setSello(s); await cargar()
  }

  if (!liqs) return <Cargando />
  const mesActual = primeroDeMes()
  const hayDelMes = liqs.some((l) => l.periodo === mesActual)
  const pendientes = liqs.filter((l) => l.estado === 'emitida' || l.estado === 'vencida')
  const porCobrar = pendientes.reduce((t, l) => t + Number(l.total) - Number(l.pagado), 0)
  const listaAl = alumnos ?? []
  const debenAlumnos = listaAl.reduce((t, c) => t + Math.max(0, Number(c.monto) - Number(c.pagado)), 0)
  const cobrado = liqs.reduce((t, l) => t + Number(l.pagado), 0) + listaAl.reduce((t, c) => t + Number(c.pagado), 0)
  const periodos = [...new Set(liqs.map((l) => l.periodo))]
  const periodosAl = [...new Set(listaAl.map((c) => c.periodo))]
  const sel = liqs.find((l) => l.id === abierta)
  const selAl = listaAl.find((c) => c.id === alumnoAbierto)
  const total = porCobrar + debenAlumnos

  return (
    <>
      <header className="cuero cabecera">
        <div className="eyebrow">Cobranza</div>
        <h1 style={{ marginTop: 6 }}>{total > 0 ? <>Faltan cobrar {pesos(total)}</> : 'Todo cobrado'}</h1>
        <p className="sec" style={{ marginTop: 6 }}>Propietarios {pesos(porCobrar)} · Alumnos {pesos(debenAlumnos)} · Cobrado {pesos(cobrado)}</p>
      </header>
      <div className="contenido">
        <div className="segmento vidrio-claro" role="tablist">
          <button role="tab" aria-selected={vista === 'propietarios'} onClick={() => { setVista('propietarios'); vibrar(6) }}>
            Propietarios<span>{porCobrar > 0 ? `deben ${pesos(porCobrar)}` : 'al día'}</span>
          </button>
          <button role="tab" aria-selected={vista === 'alumnos'} onClick={() => { setVista('alumnos'); vibrar(6) }}>
            Alumnos<span>{debenAlumnos > 0 ? `deben ${pesos(debenAlumnos)}` : 'al día'}</span>
          </button>
        </div>

        {vista === 'alumnos' ? (
          <div key="alumnos" className="entra">
            {error && <div className="alerta-banner" style={{ marginBottom: 12 }}>{error}</div>}
            <p className="sec" style={{ marginTop: 0 }}>Abonos de clases, clases sueltas y alquiler de caballos de la escuela.</p>
            {listaAl.length === 0 && <p className="sec" style={{ textAlign: 'center', marginTop: 24 }}>Todavía no hay cobros de alumnos cargados.</p>}
            {periodosAl.map((p) => (
              <div key={p}>
                <h2>{mes(p)}</h2>
                <div className="diario">
                  {listaAl.filter((c) => c.periodo === p).map((c) => {
                    const e = ESTADO_LIQ[estadoAlumno(c)]
                    const saldo = Number(c.monto) - Number(c.pagado)
                    return (
                      <button key={c.id} onClick={() => { setAlumnoAbierto(c.id); vibrar(8) }} style={{ width: '100%', textAlign: 'left', background: 'none', borderLeft: 0, borderRight: 0, borderTop: 0, cursor: 'pointer', alignItems: 'center' }}>
                        <div className="grow">
                          <div className="titulo" style={{ fontSize: 19 }}>{c.alumnos?.nombre}</div>
                          <div className="sec">{c.concepto}{saldo > 0 && Number(c.pagado) > 0 ? ` · debe ${pesos(saldo)}` : ''}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div className="num-fino">{pesos(c.monto)}</div>
                          <Pill tono={e.tono}>{e.texto}</Pill>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (<div key="propietarios" className="entra">

        {!hayDelMes && (
          <div className="tarjeta">
            <b className="titulo" style={{ fontSize: 22 }}>Cerrar {mes(mesActual).toLowerCase()}</b>
            <p className="sec" style={{ margin: '4px 0 12px' }}>Arma la cuota de cada dueño con la pensión y todos los extras cargados en el mes.</p>
            <button className="btn btn-suela" disabled={ocupado}
              onClick={() => correr(() => supabase.rpc('generar_liquidaciones', { p_escuela: escuela.id, p_periodo: mesActual }), { texto: 'Liquidaciones generadas', sub: 'Cuotas del mes armadas' })}>
              {ocupado ? 'Armando…' : 'Generar liquidaciones del mes'}
            </button>
          </div>
        )}
        {error && <div className="alerta-banner" style={{ marginTop: 12 }}>{error}</div>}

        {periodos.map((p) => (
          <div key={p}>
            <h2>{mes(p)}</h2>
            <div className="diario">
              {liqs.filter((l) => l.periodo === p).map((l) => {
                const e = ESTADO_LIQ[l.estado]
                const saldo = Number(l.total) - Number(l.pagado)
                return (
                  <button key={l.id} onClick={() => { setAbierta(l.id); vibrar(8) }} style={{ width: '100%', textAlign: 'left', background: 'none', borderLeft: 0, borderRight: 0, borderTop: 0, cursor: 'pointer', alignItems: 'center' }}>
                    <div className="grow">
                      <div className="titulo" style={{ fontSize: 19 }}>{l.duenos?.nombre}</div>
                      <div className="sec">{l.liquidacion_items.length} ítems{saldo > 0 && l.estado !== 'borrador' ? ` · debe ${pesos(saldo)}` : ''}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="num-fino">{pesos(l.total)}</div>
                      <Pill tono={e.tono}>{e.texto}</Pill>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
        </div>)}
      </div>

      {selAl && (
        <HojaInferior onCerrar={() => setAlumnoAbierto(null)}>
          <div className="fila">
            <div><h3 className="titulo" style={{ fontSize: 22 }}>{selAl.alumnos?.nombre}</h3><div className="sec">Alumno · {mes(selAl.periodo)}{selAl.vence_el ? ` · vence ${fechaCorta(selAl.vence_el)}` : ''}</div></div>
            <Pill tono={ESTADO_LIQ[estadoAlumno(selAl)].tono}>{ESTADO_LIQ[estadoAlumno(selAl)].texto}</Pill>
          </div>
          <div className="lista" style={{ marginTop: 14 }}>
            <div><div className="grow"><div style={{ fontWeight: 500 }}>{selAl.concepto}</div></div><span className="num">{pesos(selAl.monto)}</span></div>
            {Number(selAl.pagado) > 0 && <div><div className="grow">Pagado</div><span className="num" style={{ color: 'var(--oliva)' }}>− {pesos(selAl.pagado)}</span></div>}
            <div><div className="grow"><b>Saldo</b></div><span className="num titulo" style={{ fontSize: 20 }}>{pesos(Math.max(0, Number(selAl.monto) - Number(selAl.pagado)))}</span></div>
          </div>
          {estadoAlumno(selAl) !== 'pagada' && (
            <div className="pila" style={{ marginTop: 16 }}>
              <a className="btn" href={linkWhatsApp(selAl.alumnos?.telefono,
                `Hola ${selAl.alumnos?.nombre?.split(' ')[0]}! Te recuerdo ${selAl.concepto.toLowerCase()} de ${mes(selAl.periodo).toLowerCase()}: ${pesos(Number(selAl.monto) - Number(selAl.pagado))}. ¡Gracias!`)}
                target="_blank" rel="noreferrer"><Icono n="whatsapp" size={18} />Recordar por WhatsApp</a>
              <button className="btn btn-sec" disabled={ocupado}
                onClick={() => correr(() => supabase.from('cobros_alumnos').update({ pagado: selAl.monto }).eq('id', selAl.id),
                  { texto: 'Pago registrado', sub: `${selAl.alumnos?.nombre} está al día` }).then(() => setAlumnoAbierto(null))}>
                Registrar pago en efectivo
              </button>
            </div>
          )}
        </HojaInferior>
      )}

      {sel && (
        <HojaInferior onCerrar={() => setAbierta(null)}>
          <div className="fila">
            <div><h3 className="titulo" style={{ fontSize: 22 }}>{sel.duenos?.nombre}</h3><div className="sec">{mes(sel.periodo)}{sel.fecha_vencimiento ? ` · vence ${fechaCorta(sel.fecha_vencimiento)}` : ''}</div></div>
            <Pill tono={ESTADO_LIQ[sel.estado].tono}>{ESTADO_LIQ[sel.estado].texto}</Pill>
          </div>
          <div className="lista" style={{ marginTop: 14 }}>
            {[...sel.liquidacion_items].sort((a, b) => a.tipo.localeCompare(b.tipo) * -1).map((i) => (
              <div key={i.id}><div className="grow"><div style={{ fontWeight: 500 }}>{i.concepto}</div><div className="sec">{i.tipo === 'pension' ? 'Pensión' : i.tipo === 'extra' ? 'Extra' : 'Ajuste'}</div></div><span className="num">{pesos(i.monto)}</span></div>
            ))}
            <div><div className="grow"><b>Total</b></div><span className="num titulo" style={{ fontSize: 20 }}>{pesos(sel.total)}</span></div>
            {Number(sel.pagado) > 0 && <div><div className="grow">Pagado</div><span className="num" style={{ color: 'var(--oliva)' }}>− {pesos(sel.pagado)}</span></div>}
          </div>
          {sel.pagos.filter((p) => p.estado === 'aprobado').map((p, i) => (
            <p key={i} className="sec" style={{ marginTop: 8 }}>✓ {pesos(p.monto)} por {p.metodo === 'mercadopago' ? 'Mercado Pago' : p.metodo}{p.pagado_el ? ` el ${fechaCorta(p.pagado_el)}` : ''}</p>
          ))}

          <div className="pila" style={{ marginTop: 16 }}>
            {sel.estado === 'borrador' && (
              <button className="btn btn-suela" disabled={ocupado}
                onClick={() => correr(() => supabase.rpc('emitir_liquidacion', { p_liquidacion: sel.id }), { texto: 'Liquidación emitida', sub: `Cuota de ${sel.duenos?.nombre}` })}>
                Emitir y dejar lista para cobrar
              </button>
            )}
            {(sel.estado === 'emitida' || sel.estado === 'vencida') && (
              <>
                <a className="btn" href={linkWhatsApp(sel.duenos?.telefono,
                  `Hola ${sel.duenos?.nombre?.split(' ')[0]}! Te paso la cuota de ${mes(sel.periodo).toLowerCase()}: ${pesos(Number(sel.total) - Number(sel.pagado))}. La podés pagar con Mercado Pago desde acá: ${origen()}/l/${sel.token_publico}`)}
                  target="_blank" rel="noreferrer"><Icono n="whatsapp" size={18} />Mandar por WhatsApp</a>
                <button className="btn btn-sec" disabled={ocupado}
                  onClick={() => correr(() => supabase.from('pagos').insert({ escuela_id: escuela.id, liquidacion_id: sel.id, metodo: 'efectivo', estado: 'aprobado', monto: Number(sel.total) - Number(sel.pagado), pagado_el: new Date().toISOString() }),
                    { texto: 'Pago registrado', sub: `${sel.duenos?.nombre} está al día` })}>
                  Registrar pago en efectivo
                </button>
                <a className="btn btn-sec" href={`/l/${sel.token_publico}`} target="_blank" rel="noreferrer"><Icono n="link" size={18} />Ver lo que recibe el dueño</a>
              </>
            )}
          </div>
        </HojaInferior>
      )}

      {sello && <Sello texto={sello.texto} sub={sello.sub} color="var(--oliva)" onFin={() => setSello(null)} />}
    </>
  )
}
