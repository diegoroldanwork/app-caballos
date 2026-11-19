// Íconos simples de trazo para cada tipo de servicio y la navegación.
const P: Record<string, string> = {
  herradura: 'M7 20V11a5 5 0 0 1 10 0v9M7 14h0M17 14h0M7 17h0M17 17h0',
  vete: 'M6 3v6a4 4 0 0 0 8 0V3M10 13v3a4 4 0 0 0 8 0v-2M18 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4',
  vacuna: 'M18 2l4 4M20 4l-9 9M14 6l4 4M7 13l4 4M5 15l-3 3 2 2 3-3M9 11l6 6',
  analisis: 'M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3M7 15h10',
  pastilla: 'M10.5 20.5a5 5 0 0 1-7-7l10-10a5 5 0 0 1 7 7zM8.5 8.5l7 7',
  diente: 'M7 3c-3 0-4 3-3 6l2 11c.3 1.5 2 1.5 2.3 0L9 14c.3-1.3 1.7-1.3 2 0h2c.3-1.3 1.7-1.3 2 0l.7 6c.3 1.5 2 1.5 2.3 0l2-11c1-3 0-6-3-6-2 0-3 1-5 1S9 3 7 3z',
  mas: 'M12 5v14M5 12h14',
  casa: 'M3 11l9-8 9 8M5 9v12h14V9',
  caballo: 'M5 21v-6l-2-3 4-6 3-2 2-2 1 3 3 1 5 6-2 2-4-2-1 3v6M9 8h0',
  campana: 'M6 16V11a6 6 0 1 1 12 0v5l2 2H4zM10 21h4',
  plata: 'M3 6h18v12H3zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6M6 9v0M18 15v0',
  camara: 'M4 7h3l2-3h6l2 3h3v13H4zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
  whatsapp: 'M3 21l1.6-4.7A9 9 0 1 1 8 19.6zM9 8c0 4 3 7 7 7l1-2-2-1-1 1c-1.5-.5-2.5-1.5-3-3l1-1-1-2z',
  link: 'M10 14a4 4 0 0 0 6 0l3-3a4 4 0 0 0-6-6l-1 1M14 10a4 4 0 0 0-6 0l-3 3a4 4 0 0 0 6 6l1-1',
  check: 'M5 12l5 5 9-10',
  flecha: 'M15 5l-7 7 7 7',
  salir: 'M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10',
}

export function Icono({ n, size = 22 }: { n: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={P[n] ?? P.mas} />
    </svg>
  )
}
