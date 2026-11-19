import type { Metadata, Viewport } from 'next'
import { Fraunces, Inter } from 'next/font/google'
import { MARCA } from '@/lib/marca'
import './globals.css'

const fraunces = Fraunces({ subsets: ['latin'], variable: '--ff-fraunces', weight: ['500', '700'] })
const inter = Inter({ subsets: ['latin'], variable: '--ff-inter' })

export const metadata: Metadata = {
  title: `${MARCA} · la carpeta de tu caballo`,
  description: 'Servicios, sanidad y cobros de los caballos pensionados, en un solo lugar.',
  icons: { icon: '/icono.svg' },
}

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#7A3E1D' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR" className={`${fraunces.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  )
}
