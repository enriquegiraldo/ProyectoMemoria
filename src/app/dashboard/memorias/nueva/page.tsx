'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function NuevaMemoriaPage() {
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    type: 'message',
    author: '',
    content: '',
    relationship: '',
    imageUrl: ''
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.author) {
      newErrors.author = 'El nombre del autor es requerido'
    }
    
    if (!formData.content) {
      newErrors.content = 'El contenido es requerido'
    }
    
    if (!formData.relationship) {
      newErrors.relationship = 'La relación es requerida'
    }
    
    if (formData.type === 'photo' && !formData.imageUrl) {
      newErrors.imageUrl = 'La URL de la imagen es requerida para memorias tipo foto'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsLoading(true)
    
    try {
      // Aquí iría la lógica para guardar la memoria en la base de datos
      // Por ahora, simulamos un retraso y redirigimos
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Redirigir a la página de memorias
      router.push('/dashboard/memorias')
    } catch (error) {
      setErrors({
        general: 'Ocurrió un error al guardar la memoria. Por favor, intenta de nuevo.'
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Crear Nueva Memoria</h1>
        <p className="text-gray-600 mt-1">Comparte un recuerdo especial</p>
      </div>
      
      <Card>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 pt-6">
            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{errors.general}</p>
              </div>
            )}
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Tipo de Memoria</label>
              <div className="flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="type"
                    value="message"
                    checked={formData.type === 'message'}
                    onChange={handleChange}
                    className="h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-gray-700">Mensaje</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="type"
                    value="photo"
                    checked={formData.type === 'photo'}
                    onChange={handleChange}
                    className="h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-gray-700">Foto</span>
                </label>
              </div>
            </div>
            
            <Input
              label="Autor"
              type="text"
              name="author"
              value={formData.author}
              onChange={handleChange}
              placeholder="Nombre del autor"
              error={errors.author}
              required
            />
            
            <Input
              label="Relación"
              type="text"
              name="relationship"
              value={formData.relationship}
              onChange={handleChange}
              placeholder="Ej: Hermano, Amigo, Colega"
              error={errors.relationship}
              required
            />
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Contenido</label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleChange}
                placeholder="Escribe tu mensaje o descripción de la foto"
                rows={4}
                className={`w-full px-3 py-2 border ${errors.content ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                required
              />
              {errors.content && (
                <p className="text-sm text-red-600">{errors.content}</p>
              )}
            </div>
            
            {formData.type === 'photo' && (
              <Input
                label="URL de la Imagen"
                type="text"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleChange}
                placeholder="https://ejemplo.com/imagen.jpg"
                error={errors.imageUrl}
                required={formData.type === 'photo'}
              />
            )}
          </CardContent>
          
          <CardFooter className="flex justify-between space-x-4 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/dashboard/memorias')}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isLoading}
              disabled={isLoading}
            >
              {isLoading ? 'Guardando...' : 'Guardar Memoria'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}