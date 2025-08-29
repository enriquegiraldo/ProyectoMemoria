'use client'

import { useSession } from 'next-auth/react'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'

export default function DashboardPage() {
  const { data: session } = useSession()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bienvenido, {session?.user?.name || 'Usuario'}</h1>
        <p className="text-gray-600 mt-1">Aquí puedes gestionar tus memorias y recuerdos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900">Mis Memorias</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">Gestiona tus memorias y recuerdos guardados.</p>
            <Button variant="primary">
              <Link href="/dashboard/memorias">Ver mis memorias</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900">Crear Nueva Memoria</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">Crea una nueva memoria para preservar tus recuerdos.</p>
            <Button variant="primary">
              <Link href="/dashboard/memorias/nueva">Crear memoria</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900">Mi Perfil</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">Actualiza tu información personal y preferencias.</p>
            <Button variant="primary">
              <Link href="/dashboard/perfil">Editar perfil</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}