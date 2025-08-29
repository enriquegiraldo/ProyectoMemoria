'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function PerfilPage() {
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    name: 'Usuario Ejemplo',
    email: 'usuario@ejemplo.com',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    publicProfile: false
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Limpiar error cuando el usuario comienza a escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }
  
  const handleToggleChange = (name: string) => {
    setNotifications(prev => ({
      ...prev,
      [name]: !prev[name as keyof typeof prev]
    }))
  }
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.name) {
      newErrors.name = 'El nombre es requerido'
    }
    
    if (!formData.email) {
      newErrors.email = 'El correo electrónico es requerido'
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'El correo electrónico no es válido'
    }
    
    // Validar cambio de contraseña solo si se está intentando cambiar
    if (formData.currentPassword || formData.newPassword || formData.confirmPassword) {
      if (!formData.currentPassword) {
        newErrors.currentPassword = 'La contraseña actual es requerida'
      }
      
      if (!formData.newPassword) {
        newErrors.newPassword = 'La nueva contraseña es requerida'
      } else if (formData.newPassword.length < 6) {
        newErrors.newPassword = 'La contraseña debe tener al menos 6 caracteres'
      }
      
      if (formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Las contraseñas no coinciden'
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsLoading(true)
    setSuccessMessage('')
    
    try {
      // Aquí iría la lógica para actualizar el perfil en la base de datos
      // Por ahora, simulamos un retraso
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setSuccessMessage('Perfil actualizado correctamente')
    } catch (error) {
      setErrors({
        general: 'Ocurrió un error al actualizar el perfil. Por favor, intenta de nuevo.'
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
        <p className="text-gray-600 mt-1">Administra tu información personal</p>
      </div>
      
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3">
          <p className="text-sm text-green-600">{successMessage}</p>
        </div>
      )}
      
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-800">Información Personal</h2>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{errors.general}</p>
              </div>
            )}
            
            <Input
              label="Nombre"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              required
            />
            
            <Input
              label="Correo Electrónico"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              required
            />
          </CardContent>
          
          <CardHeader className="pt-4">
            <h2 className="text-xl font-semibold text-gray-800">Cambiar Contraseña</h2>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <Input
              label="Contraseña Actual"
              type="password"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
              error={errors.currentPassword}
            />
            
            <Input
              label="Nueva Contraseña"
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              error={errors.newPassword}
            />
            
            <Input
              label="Confirmar Nueva Contraseña"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
            />
          </CardContent>
          
          <CardHeader className="pt-4">
            <h2 className="text-xl font-semibold text-gray-800">Preferencias</h2>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-700">Notificaciones por correo</h3>
                <p className="text-sm text-gray-500">Recibe notificaciones sobre nuevas memorias</p>
              </div>
              <div className="relative inline-block w-10 mr-2 align-middle select-none">
                <input 
                  type="checkbox" 
                  name="emailNotifications" 
                  id="emailNotifications" 
                  checked={notifications.emailNotifications}
                  onChange={() => handleToggleChange('emailNotifications')}
                  className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                />
                <label 
                  htmlFor="emailNotifications" 
                  className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${notifications.emailNotifications ? 'bg-blue-500' : 'bg-gray-300'}`}
                ></label>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-700">Perfil público</h3>
                <p className="text-sm text-gray-500">Permite que otros usuarios vean tu perfil</p>
              </div>
              <div className="relative inline-block w-10 mr-2 align-middle select-none">
                <input 
                  type="checkbox" 
                  name="publicProfile" 
                  id="publicProfile" 
                  checked={notifications.publicProfile}
                  onChange={() => handleToggleChange('publicProfile')}
                  className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                />
                <label 
                  htmlFor="publicProfile" 
                  className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${notifications.publicProfile ? 'bg-blue-500' : 'bg-gray-300'}`}
                ></label>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-end space-x-4 pt-2">
            <Button
              type="submit"
              variant="primary"
              loading={isLoading}
              disabled={isLoading}
            >
              {isLoading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}