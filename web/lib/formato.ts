export const TIPOS: Record<string, { nombre: string; icono: string }> = {
  herraje: { nombre: 'Herraje', icono: 'herradura' },
  veterinario: { nombre: 'Veterinario', icono: 'vete' },
  vacuna: { nombre: 'Vacuna', icono: 'vacuna' },
  aie: { nombre: 'AIE', icono: 'analisis' },
  desparasitacion: { nombre: 'Desparasitación', icono: 'pastilla' },
  odontologia: { nombre: 'Odontología', icono: 'diente' },
  otro: { nombre: 'Otro', icono: 'mas' },
}

export const ESTADO_ALERTA: Record<string, { texto: string; tono: 'ok' | 'aviso' | 'mal' | 'neutro' }> = {
  al_dia: { texto: 'Al día', tono: 'ok' },
  por_vencer: { texto: 'Por vencer', tono: 'aviso' },
  vencido: { texto: 'Vencido', tono: 'mal' },
  sin_registro: { texto: 'Sin registro', tono: 'mal' },
}

export const ESTADO_LIQ: Record<string, { texto: string; tono: 'ok' | 'aviso' | 'mal' | 'neutro' }> = {
  borrador: { texto: 'Borrador', tono: 'neutro' },
  emitida: { texto: 'Pendiente', tono: 'aviso' },
  pagada: { texto: 'Pagada', tono: 'ok' },
  vencida: { texto: 'Vencida', tono: 'mal' },
  anulada: { texto: 'Anulada', tono: 'neutro' },
}

const nf = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 })
export const pesos = (n: number | string | null | undefined) => `$ ${nf.format(Number(n ?? 0))}`

function aFecha(d: string) {
  // fechas 'YYYY-MM-DD' en hora local, sin corrimiento por zona horaria
  const [y, m, dd] = d.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, dd)
}

export function fechaCorta(d?: string | null) {
  if (!d) return '—'
  return aFecha(d).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
}

export function hace(d?: string | null) {
  if (!d) return ''
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
  const dias = Math.round((hoy.getTime() - aFecha(d).getTime()) / 86400000)
  if (dias <= 0) return 'hoy'
  if (dias === 1) return 'ayer'
  if (dias < 31) return `hace ${dias} días`
  const meses = Math.round(dias / 30)
  return meses === 1 ? 'hace 1 mes' : `hace ${meses} meses`
}

export function mes(periodo?: string | null) {
  if (!periodo) return ''
  const s = aFecha(periodo).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function textoVence(dias: number | null, estado: string) {
  if (estado === 'sin_registro' || dias === null) return 'Nunca se registró'
  if (dias < 0) return `Venció hace ${-dias} días`
  if (dias === 0) return 'Vence hoy'
  return `Vence en ${dias} días`
}
