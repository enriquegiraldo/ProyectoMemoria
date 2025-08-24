import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Preserva tus{' '}
              <span className="text-primary-600">recuerdos</span>{' '}
              para siempre
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Memoria Eterna te permite guardar, organizar y compartir tus momentos más preciados 
              de manera segura y accesible para las futuras generaciones.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/register" 
                className="btn-primary text-lg px-8 py-3"
              >
                Comenzar gratis
              </Link>
              <Link 
                href="/about" 
                className="btn-outline text-lg px-8 py-3"
              >
                Conoce más
              </Link>
            </div>
          </div>
        </div>
        
        {/* Features Preview */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Fotos y Videos</h3>
              <p className="text-gray-600">
                Sube y organiza tus fotos y videos con etiquetas y descripciones detalladas.
              </p>
            </div>
            
            <div className="card text-center">
              <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Seguridad Total</h3>
              <p className="text-gray-600">
                Tus recuerdos están protegidos con encriptación de nivel bancario.
              </p>
            </div>
            
            <div className="card text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Compartir Familia</h3>
              <p className="text-gray-600">
                Comparte tus recuerdos con familiares y amigos de forma privada y segura.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
