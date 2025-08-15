'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()

  // Protección de ruta - redirige a login si no hay sesión
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  // Mostrar pantalla de carga mientras se verifica la sesión
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Barra lateral de navegación */}
      <aside className="w-64 bg-white border-r border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Memoria Eterna</h2>
          <p className="text-sm text-gray-500 mt-1">Panel de usuario</p>
        </div>
        <nav className="p-4 space-y-1">
          <Link 
            href="/dashboard" 
            className="flex items-center px-4 py-2 text-gray-700 rounded-md hover:bg-gray-100"
          >
            <span className="mr-3">🏠</span>
            Inicio
          </Link>
          <Link 
            href="/dashboard/memorias" 
            className="flex items-center px-4 py-2 text-gray-700 rounded-md hover:bg-gray-100"
          >
            <span className="mr-3">📚</span>
            Mis Memorias
          </Link>
          <Link 
            href="/dashboard/perfil" 
            className="flex items-center px-4 py-2 text-gray-700 rounded-md hover:bg-gray-100"
          >
            <span className="mr-3">👤</span>
            Mi Perfil
          </Link>
          <button 
            onClick={() => router.push('/api/auth/signout')}
            className="flex items-center w-full px-4 py-2 text-gray-700 rounded-md hover:bg-gray-100"
          >
            <span className="mr-3">🚪</span>
            Cerrar Sesión
          </button>
        </nav>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  )
}