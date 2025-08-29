import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import SessionProvider from '@/components/providers/SessionProvider'
import PWAInstallPrompt from '@/components/ui/PWAInstallPrompt'
import OfflineIndicator from '@/components/ui/OfflineIndicator'
import { initializePWA } from '@/lib/registerSW'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Memoria Eterna',
  description: 'Preserva y comparte tus recuerdos más preciados',
  keywords: ['memorias', 'recuerdos', 'familia', 'historia'],
  authors: [{ name: 'Memoria Eterna Team' }],
  robots: 'index, follow',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Memoria Eterna',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.svg', sizes: '16x16', type: 'image/svg+xml' },
      { url: '/favicon-32x32.svg', sizes: '32x32', type: 'image/svg+xml' },
      { url: '/pwa-192x192.svg', sizes: '192x192', type: 'image/svg+xml' },
      { url: '/pwa-512x512.svg', sizes: '512x512', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-touch-icon.svg', sizes: '180x180', type: 'image/svg+xml' },
    ],
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#3B82F6',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Inicializar PWA en el cliente
  if (typeof window !== 'undefined') {
    initializePWA();
  }

  return (
    <html lang="es">
      <body className={inter.className}>
        <SessionProvider>
          <div className="min-h-screen bg-gray-50">
            {children}
            <PWAInstallPrompt />
            <OfflineIndicator />
          </div>
        </SessionProvider>
      </body>
    </html>
  )
}
