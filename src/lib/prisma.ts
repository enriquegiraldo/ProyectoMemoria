import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Implementación con manejo de errores para evitar fallos en la conexión
export const prisma = globalForPrisma.prisma ?? 
  (() => {
    try {
      return new PrismaClient({
        log: ['error'],
        errorFormat: 'minimal',
      })
    } catch (error) {
      console.error('Error al inicializar Prisma Client:', error)
      // Devolver un cliente mock para evitar errores de bind
      return {
        user: {
          findUnique: async () => null,
          create: async () => null,
        },
        $connect: async () => {},
        $disconnect: async () => {},
      } as unknown as PrismaClient
    }
  })()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
