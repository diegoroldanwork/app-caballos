'use client'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useEscuela } from '@/lib/escuela'
import { traerCaballos, traerAlertas, importa, Caballo, Alerta } from '@/lib/datos'
import { TIPOS, ESTADO_ALERTA, textoVence, fechaCorta } from '@/lib/formato'
import { Retrato } from '@/components/Retrato'
import { Pill, vibrar } from '@/components/ui'
import { Cargando } from '@/components/Cargando'
import { HojaInferior } from '@/components/HojaInferior'
import { Sello } from '@/components/Sello'

const GRUPOS: { estado: Alerta['estado']; titulo: string }[] = [
  { estado: 'vencido', titulo: 'Vencidos' },
  { estado: 'por_vencer', titulo: 'Por vencer' },
  { estado: 'sin_registro', titulo: 'Nunca registrado' },
]
const FILTROS = ['todos', 'aie', 'vacuna', 'herraje'] as const

type TipoVisita = 'herrero' | 'veterinario' | 'odontologo'
type Visita = { id: string; tipo: TipoVisita; fecha: string; hora: string | null; profesional: string | null }
const PROFESIONALES: { tipo: TipoVisita; nombre: string; controles: string[] }[] = [
  { tipo: 'herrero', nombre: 'Herrero', controles: ['herraje'] },
  { tipo: 'veterinario', nombre: 'Veterinario', controles: ['vacuna', 'aie', 'veterinario', 'desparasitacion'] },
  { tipo: 'odontologo', nombre: 'Odontólogo', controles: ['odontologia'] },
]

const hoy = () => new Date().toISOString().slice(0, 10)
const sumarDias = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10) }
const diaSemana = (f: string) => new Date(f + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'short' }).replace('.', '')

/** Si no hay visita agendada, sugiere una fecha a partir de lo que vence primero. */
function sugerencia(alertas: Alerta[], controles: string[]) {
  const pend = alertas.filter((a) => controles.includes(a.tipo) && a.estado !== 'al_dia')
  if (!pend.length) return null
  const urgentes = pend.filter((a) => a.estado === 'vencido' || a.estado === 'sin_registro')
  if (urgentes.length) return { fecha: sumarDias(2), motivo: `${urgentes.length} ${urgentes.length === 1 ? 'caballo lo necesita' : 'caballos lo necesitan'}` }
  const min = Math.min(...pend.map((a) => a.dias_restantes ?? 0))
  return { fecha: sumarDias(Math.max(1, min - 3)), motivo: `antes de que venza` }
}

export default function Alertas() {
  const escuela = useEscuela()
  const [caballos, setCaballos] = useState<Caballo[] | null>(null)
  const [alertas, setAlertas] = useState<Alerta[]>([])
  const [visitas, setVisitas] = useState<Visita[] | null>(null)
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number]>('todos')
  const [verAlDia, setVerAlDia] = useState(false)
  const [agendar, setAgendar] = useState<TipoVisita | null>(null)
  const [form, setForm] = useState({ fecha: '', hora: '', profesional: '' })
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sello, setSello] = useState<string | null>(null)

  const cargarVisitas = useCallback(async () => {
    const { data, error } = await supabase.from('visitas').select('id, tipo, fecha, hora, profesional')
      .eq('escuela_id', escuela.id).gte('fecha', hoy()).order('fecha').order('hora')
    setVisitas(error ? [] : ((data ?? []) as Visita[]))
  }, [escuela.id])

  useEffect(() => {
    Promise.all([traerCaballos(escuela.id), traerAlertas(escuela.id)]).then(([c, a]) => { setCaballos(c); setAlertas(a) })
    cargarVisitas()
  }, [escuela.id, cargarVisitas])

  if (!caballos) return <Cargando />
  const porId = Object.fromEntries(caballos.map((c) => [c.id, c]))
  const visibles = alertas.filter((a) => filtro === 'todos' || a.tipo === filtro)
  const alDia = visibles.filter((a) => a.estado === 'al_dia').sort((a, b) => (a.dias_restantes ?? 0) - (b.dias_restantes ?? 0))
  const proxima = (t: TipoVisita) => visitas?.find((v) => v.tipo === t)

  function abrir(t: TipoVisita) {
    const v = proxima(t)
    const p = PROFESIONALES.find((x) => x.tipo === t)!
    const s = sugerencia(alertas, p.controles)
    setForm({ fecha: v?.fecha ?? s?.fecha ?? sumarDias(7), hora: v?.hora?.slice(0, 5) ?? '09:00', profesional: v?.profesional ?? '' })
    setError(null); setAgendar(t); vibrar(8)
  }

  async function guardar() {
    if (!agendar || !form.fecha) return
    setOcupado(true); setError(null)
    const v = proxima(agendar)
    const fila = { fecha: form.fecha, hora: form.hora || null, profesional: form.profesional || null }
    const { error } = v
      ? await supabase.from('visitas').update(fila).eq('id', v.id)
      : await supabase.from('visitas').insert({ ...fila, escuela_id: escuela.id, tipo: agendar })
    setOcupado(false)
    if (error) return setError(error.message.includes('visitas') ? 'Falta crear la tabla de visitas en la base (ver deploy/alumnos_y_visitas.sql).' : error.message)
    const nombre = PROFESIONALES.find((x) => x.tipo === agendar)!.nombre
    setAgendar(null); setSello(`${nombre} agendado`); await cargarVisitas()
  }

  return (
    <>
      <header className="cuero cabecera">
        <div className="eyebrow">Sanidad</div>
        <h1 style={{ marginTop: 6 }}>Libreta de la caballeriza</h1>
      </header>
      <div className="contenido">
        <section className="visitas-fijas vidrio-claro" aria-label="Próximas visitas">
          <div className="eyebrow">Próximas visitas</div>
          <div className="visitas">
            {PROFESIONALES.map((p) => {
              const v = proxima(p.tipo)
              const s = v ? null : sugerencia(alertas, p.controles)
              const dias = v ? Math.round((new Date(v.fecha + 'T12:00:00').getTime() - new Date(hoy() + 'T12:00:00').getTime()) / 864e5) : null
              return (
                <button key={p.tipo} className={`visita ${v ? (dias! <= 3 ? 'pronto' : '') : 'sugerida'}`} onClick={() => abrir(p.tipo)}>
                  <small>{p.nombre}</small>
                  {v ? (
                    <>
                      <b>{diaSemana(v.fecha)} {fechaCorta(v.fecha)}</b>
                      <span>{v.hora ? `${v.hora.slice(0, 5)} h` : 'Sin hora'}{dias === 0 ? ' · hoy' : dias === 1 ? ' · mañana' : ''}</span>
                    </>
                  ) : s ? (
                    <><b>Agendar</b><span>Sugerido {fechaCorta(s.fecha)}</span></>
                  ) : (
                    <><b>Sin fecha</b><span>Tocá para agendar</span></>
                  )}
                </button>
              )
            })}
          </div>
        </section>

        <div className="fila" style={{ gap: 6, justifyContent: 'flex-start', flexWrap: 'wrap' }}>
          {FILTROS.map((f) => (
            <button key={f} className={`btn btn-chico ${filtro === f ? 'btn-suela' : 'btn-sec'}`} onClick={() => { setFiltro(f); setVerAlDia(false) }}>
              {f === 'todos' ? 'Todo' : TIPOS[f].nombre}
            </button>
          ))}
        </div>
        <div key={filtro} className="entra">
          {GRUPOS.map((g) => {
            const items = visibles.filter((a) => a.estado === g.estado).sort((a, b) => (a.dias_restantes ?? -999) - (b.dias_restantes ?? -999))
            if (!items.length) return null
            return (
              <div key={g.estado}>
                <h2 className="fila">{g.titulo} <span className="sec">{items.length}</span></h2>
                <div className="diario">
                  {items.map((a) => (
                    <Link key={a.caballo_id + a.tipo} href={`/escuela/nuevo?caballo=${a.caballo_id}&tipo=${a.tipo}`}>
                      <Retrato nombre={a.caballo} foto={porId[a.caballo_id]?.foto_path} size={40} />
                      <div className="grow"><div><b className="titulo" style={{ fontSize: 18 }}>{a.caballo}</b> · {TIPOS[a.tipo]?.nombre}</div><div className="sec">{textoVence(a.dias_restantes, a.estado)}</div></div>
                      <Pill tono={importa(a) ? ESTADO_ALERTA[a.estado].tono : 'neutro'}>{ESTADO_ALERTA[a.estado].texto}</Pill>
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}

          {alDia.length > 0 && (
            <button className="al-dia-boton" aria-expanded={verAlDia} onClick={() => { setVerAlDia(!verAlDia); vibrar(6) }}>
              {alDia.length} {alDia.length === 1 ? 'control al día' : 'controles al día'} ✓ · {verAlDia ? 'Ocultar' : 'Ver cuáles'}
            </button>
          )}
          {verAlDia && (
            <div className="entra">
              <h2 className="fila">Al día <span className="sec">{alDia.length}</span></h2>
              <div className="diario">
                {alDia.map((a) => (
                  <Link key={a.caballo_id + a.tipo} href={`/escuela/caballos/${a.caballo_id}`}>
                    <Retrato nombre={a.caballo} foto={porId[a.caballo_id]?.foto_path} size={40} />
                    <div className="grow"><div><b className="titulo" style={{ fontSize: 18 }}>{a.caballo}</b> · {TIPOS[a.tipo]?.nombre}</div><div className="sec">{textoVence(a.dias_restantes, a.estado)}</div></div>
                    <Pill tono="ok">Al día</Pill>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {agendar && (
        <HojaInferior onCerrar={() => setAgendar(null)}>
          <h3 className="titulo" style={{ fontSize: 24 }}>{proxima(agendar) ? 'Cambiar visita' : 'Agendar visita'} · {PROFESIONALES.find((x) => x.tipo === agendar)!.nombre}</h3>
          {(() => {
            const p = PROFESIONALES.find((x) => x.tipo === agendar)!
            const pend = alertas.filter((a) => p.controles.includes(a.tipo) && a.estado !== 'al_dia')
            return pend.length > 0 && <p className="sec" style={{ marginTop: 4 }}>Lo esperan: {[...new Set(pend.map((a) => a.caballo))].join(', ')}.</p>
          })()}
          <div className="pila" style={{ marginTop: 16 }}>
            <div className="fila" style={{ gap: 10 }}>
              <label className="campo grow">Día<input className="input" type="date" value={form.fecha} min={hoy()} onChange={(e) => setForm({ ...form, fecha: e.target.value })} /></label>
              <label className="campo" style={{ width: 120 }}>Hora<input className="input" type="time" value={form.hora} onChange={(e) => setForm({ ...form, hora: e.target.value })} /></label>
            </div>
            <label className="campo">Profesional<input className="input" placeholder="Nombre (opcional)" value={form.profesional} onChange={(e) => setForm({ ...form, profesional: e.target.value })} /></label>
            {error && <div className="alerta-banner">{error}</div>}
            <button className="btn btn-suela" disabled={ocupado || !form.fecha} onClick={guardar}>{ocupado ? 'Guardando…' : 'Guardar visita'}</button>
          </div>
        </HojaInferior>
      )}

      {sello && <Sello texto={sello} sub="Queda fijado arriba en Sanidad" color="var(--oliva)" onFin={() => setSello(null)} />}
    </>
  )
}
