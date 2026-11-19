import { supabase } from './supabase'

export type Caballo = {
  id: string; nombre: string; raza: string | null; pelaje: string | null; sexo: string | null
  microchip: string | null; foto_path: string | null; token_publico: string; cuota_pension: number
  dueno_id: string; duenos: { nombre: string; telefono: string | null } | null
}
export type Alerta = {
  caballo_id: string; caballo: string; tipo: string; ultima_fecha: string | null
  vence_el: string | null; estado: 'al_dia' | 'por_vencer' | 'vencido' | 'sin_registro'; dias_restantes: number | null
}
export type Servicio = {
  id: string; caballo_id: string; tipo: string; fecha: string; descripcion: string | null
  profesional: string | null; costo: number; foto_path: string | null; facturable: boolean; created_at: string
}

export async function traerCaballos(escuela: string) {
  const { data, error } = await supabase
    .from('caballos')
    .select('id, nombre, raza, pelaje, sexo, microchip, foto_path, token_publico, cuota_pension, dueno_id, duenos(nombre, telefono)')
    .eq('escuela_id', escuela).eq('activo', true).order('nombre')
  if (error) throw error
  return (data ?? []) as unknown as Caballo[]
}

export async function traerAlertas(escuela: string) {
  const { data, error } = await supabase.from('alertas_sanitarias').select('*').eq('escuela_id', escuela)
  if (error) throw error
  return (data ?? []) as Alerta[]
}

/** Lo que vale la pena mostrar como alerta: vencido / por vencer, o nunca registrado en AIE, vacuna o herraje. */
export const importa = (a: Alerta) =>
  a.estado === 'vencido' || a.estado === 'por_vencer' || (a.estado === 'sin_registro' && ['aie', 'vacuna', 'herraje'].includes(a.tipo))

const GRAVEDAD = { vencido: 3, sin_registro: 2, por_vencer: 1, al_dia: 0 } as const
export const gravedad = (e: Alerta['estado']) => GRAVEDAD[e]

/** Estado más grave por caballo, para el puntito de color. */
export function peorPorCaballo(alertas: Alerta[]) {
  const m: Record<string, Alerta['estado']> = {}
  for (const a of alertas) if (importa(a) && (!m[a.caballo_id] || gravedad(a.estado) > gravedad(m[a.caballo_id]))) m[a.caballo_id] = a.estado
  return m
}

export const COLOR_ESTADO: Record<string, string> = {
  vencido: 'var(--mal)', sin_registro: 'var(--mal)', por_vencer: 'var(--mostaza)', al_dia: 'var(--oliva)',
}

export function linkWhatsApp(tel: string | null | undefined, texto: string) {
  const n = (tel ?? '').replace(/\D/g, '')
  return `https://wa.me/${n}?text=${encodeURIComponent(texto)}`
}

export const origen = () => (typeof window !== 'undefined' ? window.location.origin : '')
