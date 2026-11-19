import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, Inter } from 'next/font/google'
import { MARCA } from '@/lib/marca'
import './globals.css'

const serif = Cormorant_Garamond({ subsets: ['latin'], variable: '--ff-serif', weight: ['500', '600', '700'] })
const inter = Inter({ subsets: ['latin'], variable: '--ff-inter' })

export const metadata: Metadata = {
  title: `${MARCA} · la carpeta de tu caballo`,
  description: 'Servicios, sanidad y cobros de los caballos pensionados, en un solo lugar.',
  icons: { icon: '/icono.svg' },
}

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#1E1712' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR" className={`${serif.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  )
}
