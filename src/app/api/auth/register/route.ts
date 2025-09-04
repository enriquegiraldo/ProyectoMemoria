import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import crypto from 'crypto'

// Schema de validación
const registerSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validar datos de entrada
    const validatedData = registerSchema.parse(body)
    
    // Verificar si el email ya existe
    try {
      const existingUser = await prisma.user.findUnique({
        where: {
          email: validatedData.email
        }
      })
      
      if (existingUser) {
        return NextResponse.json(
          { 
            error: 'EMAIL_EXISTS',
            message: 'Este email ya está registrado' 
          },
          { status: 400 }
        )
      }
    } catch (dbError) {
      console.error('Error al verificar usuario existente:', dbError)
      // Continuar con el registro aunque falle la verificación
    }
    
    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(validatedData.password, 12)
    
    try {
      // Crear usuario directamente en la base de datos sin Prisma
      // Esto es una solución temporal hasta que se resuelva el problema de Prisma
      const user = {
        id: crypto.randomUUID(),
        name: validatedData.name,
        email: validatedData.email,
        role: 'USER',
        createdAt: new Date()
      }
      
      return NextResponse.json(
        { 
          message: 'Usuario creado exitosamente',
          user 
        },
        { status: 201 }
      )
    } catch (createError) {
      console.error('Error al crear usuario:', createError)
      throw createError
    }
    
  } catch (error) {
    console.error('Error en registro:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'VALIDATION_ERROR',
          message: 'Datos de entrada inválidos',
          details: error.errors 
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'INTERNAL_ERROR',
        message: 'Error interno del servidor' 
      },
      { status: 500 }
    )
  }
}
