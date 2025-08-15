import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import SessionProvider from '@/components/providers/SessionProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Memoria Eterna',
  description: 'Preserva y comparte tus recuerdos más preciados',
  keywords: ['memorias', 'recuerdos', 'familia', 'historia'],
  authors: [{ name: 'Memoria Eterna Team' }],
  robots: 'index, follow',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <SessionProvider>
          <div className="min-h-screen bg-gray-50">
            {children}
          </div>
        </SessionProvider>
      </body>
    </html>
  )
}
