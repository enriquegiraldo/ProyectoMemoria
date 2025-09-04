// src/lib/auth.ts
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        })

        if (!user || !user.password) { // Añadida verificación por si el password es null
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }
        
        // El objeto que retornas aquí es el que recibe el callback 'jwt'
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role, // Asegúrate de que 'role' exista en tu modelo de Prisma
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    // El código aquí está ahora limpio, sin '(as any)'
    async jwt({ token, user }) {
      // El objeto 'user' solo está disponible en el primer inicio de sesión
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      // El token tiene la información que pasamos en el callback 'jwt'
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login'
  },
  secret: process.env.NEXTAUTH_SECRET,
};