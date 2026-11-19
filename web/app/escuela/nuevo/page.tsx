'use client'
import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useEscuela } from '@/lib/escuela'
import { traerCaballos, Caballo } from '@/lib/datos'
import { TIPOS, pesos } from '@/lib/formato'
import { comprimir } from '@/lib/foto'
import { Retrato } from '@/components/Retrato'
import { Icono } from '@/components/Icono'
import { Sello } from '@/components/Sello'
import { vibrar } from '@/components/ui'
import { Cargando } from '@/components/Cargando'

// Valores sugeridos para cargar en dos toques
const SUGERIDO: Record<string, { costo: number[]; profesional: string; descripcion: string }> = {
  herraje: { costo: [38000, 45000, 25000], profesional: 'Herrador Raúl Medina', descripcion: 'Herraje completo, 4 patas' },
  veterinario: { costo: [35000, 45000, 60000], profesional: 'Vet. Carolina Paz', descripcion: 'Revisión' },
  vacuna: { costo: [18000, 22000], profesional: 'Vet. Carolina Paz', descripcion: 'Influenza equina' },
  aie: { costo: [28000, 32000], profesional: 'Vet. Carolina Paz', descripcion: 'Extracción para AIE' },
  desparasitacion: { costo: [9000, 12000], profesional: 'Personal de la escuela', descripcion: 'Desparasitación oral' },
  odontologia: { costo: [55000, 70000], profesional: 'Odont. equino', descripcion: 'Limado de dientes' },
  otro: { costo: [10000, 20000], profesional: '', descripcion: '' },
}

export default function Pagina() {
  return <Suspense fallback={<Cargando />}><NuevoServicio /></Suspense>
}

function NuevoServicio() {
  const escuela = useEscuela()
  const router = useRouter()
  const qs = useSearchParams()
  const [caballos, setCaballos] = useState<Caballo[] | null>(null)
  const [caballo, setCaballo] = useState<string | null>(qs.get('caballo'))
  const [tipo, setTipo] = useState<string | null>(qs.get('tipo'))
  const [foto, setFoto] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [costo, setCosto] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [profesional, setProfesional] = useState('')
  const [facturable, setFacturable] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hecho, setHecho] = useState<{ id: string } | null>(null)
  const fotoRef = useRef<HTMLInputElement>(null)
  const pasoRef = useRef<HTMLDivElement>(null)

  useEffect(() => { traerCaballos(escuela.id).then(setCaballos) }, [escuela.id])

  useEffect(() => {
    if (!tipo) return
    const s = SUGERIDO[tipo]
    setDescripcion(s.descripcion); setProfesional(s.profesional)
    if (!costo) setCosto(String(s.costo[0]))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipo])

  function elegirFoto(f?: File) {
    if (!f) return
    setFoto(f); setPreview(URL.createObjectURL(f)); vibrar(10)
  }

  async function guardar() {
    if (!caballo || !tipo) return
    setGuardando(true); setError(null)
    try {
      let foto_path: string | null = null
      if (foto) {
        const blob = await comprimir(foto)
        foto_path = `${escuela.id}/${caballo}/${crypto.randomUUID()}.jpg`
        const up = await supabase.storage.from('fotos').upload(foto_path, blob, { contentType: 'image/jpeg' })
        if (up.error) throw up.error
      }
      const { data, error } = await supabase.from('servicios').insert({
        escuela_id: escuela.id, caballo_id: caballo, tipo,
        descripcion: descripcion || null, profesional: profesional || null,
        costo: Number(costo || 0), facturable, foto_path,
      }).select('id').single()
      if (error) throw error
      setHecho({ id: data.id })
    } catch (e: any) {
      setError(e?.message ?? 'No se pudo guardar')
      setGuardando(false)
    }
  }

  if (!caballos) return <Cargando />
  const elegido = caballos.find((c) => c.id === caballo)
  const listo = !!caballo && !!tipo

  return (
    <>
      <header className="cuero cabecera">
        <h1>Cargar servicio</h1>
        <p className="sec" style={{ marginTop: 4 }}>Queda en la carpeta del caballo y se suma a la cuota del mes.</p>
      </header>

      <div className="contenido" ref={pasoRef}>
        <div className="paso"><i>1</i>¿A qué caballo?</div>
        <div className="chips">
          {caballos.map((c) => (
            <button key={c.id} className="chip" aria-pressed={caballo === c.id} onClick={() => { setCaballo(c.id); vibrar(8) }}>
              <Retrato nombre={c.nombre} pelaje={c.pelaje} foto={c.foto_path} size={48} />{c.nombre}
            </button>
          ))}
        </div>

        <div className="paso"><i>2</i>¿Qué se le hizo?</div>
        <div className="chips">
          {Object.entries(TIPOS).map(([k, t]) => (
            <button key={k} className="chip" aria-pressed={tipo === k} onClick={() => { setTipo(k); setCosto(String(SUGERIDO[k].costo[0])); vibrar(8) }}>
              <Icono n={t.icono} size={26} />{t.nombre}
            </button>
          ))}
        </div>

        <div className="paso"><i>3</i>Una foto <span className="sec" style={{ fontWeight: 400 }}>(opcional)</span></div>
        <label className="foto-input">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Foto del servicio" />
          ) : (
            <><Icono n="camara" size={34} /><b>Sacar foto</b><span className="sec">del casco, la herida o el certificado</span></>
          )}
          <input ref={fotoRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => elegirFoto(e.target.files?.[0])} />
        </label>

        <div className="paso"><i>4</i>¿Cuánto salió?</div>
        <div className="costo">
          <span className="titulo" style={{ fontSize: 28 }}>$</span>
          <input className="input" inputMode="numeric" value={costo ? Number(costo).toLocaleString('es-AR') : ''} placeholder="0"
            onChange={(e) => setCosto(e.target.value.replace(/\D/g, ''))} />
        </div>
        {tipo && (
          <div className="montos">
            {SUGERIDO[tipo].costo.map((m) => <button key={m} onClick={() => setCosto(String(m))}>{pesos(m)}</button>)}
          </div>
        )}
        <div className="pila" style={{ marginTop: 14 }}>
          <label className="campo">Detalle<input className="input" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Ej: herraje completo" /></label>
          <label className="campo">Quién lo hizo<input className="input" value={profesional} onChange={(e) => setProfesional(e.target.value)} placeholder="Ej: Herrador Raúl Medina" /></label>
          <label className="fila tarjeta" style={{ cursor: 'pointer' }}>
            <span><b>Cobrarlo como extra</b><div className="sec">Se suma a la cuota de {elegido?.duenos?.nombre ?? 'su dueño'}</div></span>
            <input type="checkbox" checked={facturable} onChange={(e) => setFacturable(e.target.checked)} style={{ width: 22, height: 22, accentColor: 'var(--oliva)' }} />
          </label>
        </div>

        {error && <div className="alerta-banner" style={{ marginTop: 14 }}>{error}</div>}
        <button className="btn" style={{ marginTop: 18, padding: 17, fontSize: 16 }} disabled={!listo || guardando} onClick={guardar}>
          {guardando ? 'Guardando…' : listo ? `Guardar en la carpeta de ${elegido?.nombre}` : 'Elegí caballo y servicio'}
        </button>
      </div>

      {hecho && (
        <Sello texto="Cargado" sub={`${TIPOS[tipo!]?.nombre} de ${elegido?.nombre}`}
          onFin={() => router.push(`/escuela/caballos/${caballo}?nuevo=${hecho.id}`)} />
      )}
    </>
  )
}
