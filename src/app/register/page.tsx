'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card'

export default function RegisterPage() {
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'El nombre debe tener al menos 2 caracteres'
    }

    if (!formData.email) {
      newErrors.email = 'El email es requerido'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El email no es válido'
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida'
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirma tu contraseña'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsLoading(true)
    setErrors({})

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.error === 'EMAIL_EXISTS') {
          setErrors({
            email: 'Este email ya está registrado'
          })
        } else {
          setErrors({
            general: data.message || 'Error al crear la cuenta'
          })
        }
      } else {
        // Registration successful, redirect to login
        router.push('/login?message=account_created')
      }
    } catch (error) {
      setErrors({
        general: 'Ocurrió un error inesperado. Por favor, intenta de nuevo.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Memoria Eterna</h1>
          <h2 className="mt-6 text-2xl font-semibold text-gray-900">
            Crear Cuenta
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Únete a nuestra comunidad y comienza a preservar tus recuerdos
          </p>
        </div>

        {/* Register Form */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900">
              Información Personal
            </h3>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {errors.general && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-600">{errors.general}</p>
                </div>
              )}

              <Input
                label="Nombre completo"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Tu nombre completo"
                error={errors.name}
                required
              />

              <Input
                label="Email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="tu@email.com"
                error={errors.email}
                required
              />

              <Input
                label="Contraseña"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                error={errors.password}
                helperText="Mínimo 6 caracteres"
                required
              />

              <Input
                label="Confirmar contraseña"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                error={errors.confirmPassword}
                required
              />
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={isLoading}
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
              </Button>

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  ¿Ya tienes una cuenta?{' '}
                  <Link 
                    href="/login" 
                    className="font-medium text-primary-600 hover:text-primary-500"
                  >
                    Inicia sesión aquí
                  </Link>
                </p>
              </div>
            </CardFooter>
          </form>
        </Card>

        {/* Back to home */}
        <div className="text-center">
          <Link 
            href="/" 
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
