import Link from 'next/link'
import Button from '@/components/ui/Button'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Memoria Eterna</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="outline" size="sm">
                  Iniciar Sesión
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="primary" size="sm">
                  Registrarse
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
            Preserva tus{' '}
            <span className="text-blue-600">recuerdos más preciados</span>
          </h2>
          <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
            Memoria Eterna te permite guardar, organizar y compartir los momentos 
            más importantes de tu vida. Crea un legado digital que perdurará 
            para las futuras generaciones.
          </p>
          <div className="mt-10 flex justify-center space-x-4">
            <Link href="/register">
              <Button variant="primary" size="lg">
                Comenzar Gratis
              </Button>
            </Link>
            <Link href="/about">
              <Button variant="outline" size="lg">
                Conoce Más
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Escribe tus Historias</h3>
              <p className="mt-2 text-gray-600">
                Captura tus recuerdos con texto rico, imágenes y organiza por categorías.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Comparte con Familia</h3>
              <p className="mt-2 text-gray-600">
                Comparte tus memorias con familiares y amigos de forma segura y privada.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-purple-100">
                <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Legado Eterno</h3>
              <p className="mt-2 text-gray-600">
                Crea un legado digital que perdurará para las futuras generaciones.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900">
              ¿Listo para comenzar tu viaje?
            </h3>
            <p className="mt-4 text-gray-600">
              Únete a miles de personas que ya están preservando sus recuerdos más preciados.
            </p>
            <div className="mt-6">
              <Link href="/register">
                <Button variant="primary" size="lg">
                  Crear Mi Primera Memoria
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h3 className="text-xl font-bold">Memoria Eterna</h3>
            <p className="mt-2 text-gray-400">
              Preservando recuerdos, conectando generaciones
            </p>
            <div className="mt-6 flex justify-center space-x-6">
              <Link href="/privacy" className="text-gray-400 hover:text-white">
                Privacidad
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-white">
                Términos
              </Link>
              <Link href="/contact" className="text-gray-400 hover:text-white">
                Contacto
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
