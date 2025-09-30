// middleware.ts
//src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { z } from 'zod'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Rutas públicas que no requieren autenticación
  const publicRoutes = ['/', '/login', '/register', '/api/auth']
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
  
  // Rutas protegidas que requieren autenticación
  const protectedRoutes = ['/dashboard', '/memories', '/profile', '/admin']
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  
  // Obtener el token de autenticación
  const token = request.cookies.get('auth-token')?.value
  
  // Si es una ruta protegida y no hay token, redirigir al login
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }
  
  // Si hay token y está en una ruta pública de auth, redirigir al dashboard
  if (token && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  // Continuar con la solicitud
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
const createPaymentSchema = z.object({
  body: z.object({
    amount: z.number().positive(),
    currency: z.string().optional(),
    customerId: z.string().optional(),
    paymentMethodId: z.string().optional(),
    description: z.string().optional(),
    metadata: z.record(z.string()).optional(),
    isTest: z.boolean().optional(),
  })
});