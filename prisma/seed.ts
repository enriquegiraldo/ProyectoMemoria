import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...')

  // Limpiar base de datos
  console.log('🧹 Limpiando base de datos...')
  await prisma.like.deleteMany()
  await prisma.comment.deleteMany()
  await prisma.memory.deleteMany()
  await prisma.user.deleteMany()
  await prisma.category.deleteMany()
  await prisma.tag.deleteMany()

  // Crear usuarios de prueba
  console.log('👥 Creando usuarios de prueba...')
  const hashedPassword = await bcrypt.hash('password123', 12)

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@memoriaeterna.com',
      name: 'Administrador',
      password: hashedPassword,
      role: 'ADMIN',
    },
  })

  const user1 = await prisma.user.create({
    data: {
      email: 'maria@example.com',
      name: 'María García',
      password: hashedPassword,
      role: 'USER',
    },
  })

  const user2 = await prisma.user.create({
    data: {
      email: 'juan@example.com',
      name: 'Juan Pérez',
      password: hashedPassword,
      role: 'USER',
    },
  })

  // Crear categorías
  console.log('📂 Creando categorías...')
  const familia = await prisma.category.create({
    data: {
      name: 'Familia',
      description: 'Recuerdos familiares y momentos especiales',
      color: '#3B82F6',
    },
  })

  const viajes = await prisma.category.create({
    data: {
      name: 'Viajes',
      description: 'Aventuras y experiencias de viaje',
      color: '#10B981',
    },
  })

  const trabajo = await prisma.category.create({
    data: {
      name: 'Trabajo',
      description: 'Logros profesionales y momentos laborales',
      color: '#F59E0B',
    },
  })

  const hobbies = await prisma.category.create({
    data: {
      name: 'Hobbies',
      description: 'Pasatiempos y actividades recreativas',
      color: '#8B5CF6',
    },
  })

  // Crear tags
  console.log('🏷️ Creando tags...')
  const tags = await Promise.all([
    prisma.tag.create({ data: { name: 'infancia' } }),
    prisma.tag.create({ data: { name: 'graduación' } }),
    prisma.tag.create({ data: { name: 'boda' } }),
    prisma.tag.create({ data: { name: 'vacaciones' } }),
    prisma.tag.create({ data: { name: 'amigos' } }),
    prisma.tag.create({ data: { name: 'música' } }),
    prisma.tag.create({ data: { name: 'deportes' } }),
    prisma.tag.create({ data: { name: 'cocina' } }),
  ])

  // Crear memorias de prueba
  console.log('📝 Creando memorias de prueba...')
  const memories = await Promise.all([
    prisma.memory.create({
      data: {
        title: 'Mi primer día de escuela',
        content: 'Recuerdo perfectamente el día que entré por primera vez a la escuela. Tenía 6 años y estaba muy nervioso. Mi mamá me acompañó hasta la puerta y me dio un abrazo muy fuerte. La maestra era muy amable y me ayudó a sentirme cómodo. Ese día conocí a mis primeros amigos de la infancia.',
        isPublic: true,
        publishedAt: new Date(),
        authorId: user1.id,
        categoryId: familia.id,
        tags: {
          connect: [
            { id: tags[0].id }, // infancia
            { id: tags[4].id }, // amigos
          ],
        },
      },
    }),

    prisma.memory.create({
      data: {
        title: 'Viaje a la playa con la familia',
        content: 'El verano pasado fuimos toda la familia a la playa. Fue un viaje increíble de 5 días donde disfrutamos del sol, el mar y la arena. Los niños construyeron castillos de arena gigantes, jugamos voleyball en la playa y por las noches cenamos en restaurantes locales. El atardecer desde nuestro balcón era espectacular.',
        isPublic: true,
        publishedAt: new Date(),
        authorId: user1.id,
        categoryId: viajes.id,
        tags: {
          connect: [
            { id: tags[0].id }, // infancia
            { id: tags[3].id }, // vacaciones
          ],
        },
      },
    }),

    prisma.memory.create({
      data: {
        title: 'Mi graduación universitaria',
        content: 'Después de 5 años de estudio, finalmente me gradué de la universidad. La ceremonia fue muy emotiva, especialmente cuando vi a mis padres orgullosos en la audiencia. Recibí mi diploma con lágrimas en los ojos, sabiendo que era el resultado de mucho esfuerzo y dedicación.',
        isPublic: true,
        publishedAt: new Date(),
        authorId: user2.id,
        categoryId: trabajo.id,
        tags: {
          connect: [
            { id: tags[1].id }, // graduación
          ],
        },
      },
    }),

    prisma.memory.create({
      data: {
        title: 'Aprendiendo a tocar guitarra',
        content: 'Hace un año decidí aprender a tocar guitarra. Al principio fue muy difícil, pero con práctica constante logré tocar mi primera canción completa. Ahora puedo tocar varias canciones y es una actividad que me relaja mucho después de un día de trabajo.',
        isPublic: true,
        publishedAt: new Date(),
        authorId: user2.id,
        categoryId: hobbies.id,
        tags: {
          connect: [
            { id: tags[5].id }, // música
          ],
        },
      },
    }),

    prisma.memory.create({
      data: {
        title: 'Receta secreta de mi abuela',
        content: 'Mi abuela me enseñó a hacer su famosa tarta de manzana. Es una receta que ha pasado de generación en generación en nuestra familia. El secreto está en la masa, que debe reposar por lo menos 2 horas antes de hornear. Cada vez que la hago, me acuerdo de ella y de todos los momentos que pasamos juntas en la cocina.',
        isPublic: false,
        authorId: user1.id,
        categoryId: familia.id,
        tags: {
          connect: [
            { id: tags[7].id }, // cocina
          ],
        },
      },
    }),
  ])

  // Crear comentarios
  console.log('💬 Creando comentarios...')
  await Promise.all([
    prisma.comment.create({
      data: {
        content: '¡Qué recuerdo tan bonito! Yo también recuerdo mi primer día de escuela.',
        authorId: user2.id,
        memoryId: memories[0].id,
      },
    }),

    prisma.comment.create({
      data: {
        content: 'Las vacaciones en familia son las mejores. ¡Espero que puedan repetir el viaje pronto!',
        authorId: adminUser.id,
        memoryId: memories[1].id,
      },
    }),

    prisma.comment.create({
      data: {
        content: '¡Felicidades por tu graduación! Es un logro muy importante.',
        authorId: user1.id,
        memoryId: memories[2].id,
      },
    }),
  ])

  // Crear likes
  console.log('❤️ Creando likes...')
  await Promise.all([
    prisma.like.create({
      data: {
        userId: user2.id,
        memoryId: memories[0].id,
      },
    }),

    prisma.like.create({
      data: {
        userId: adminUser.id,
        memoryId: memories[1].id,
      },
    }),

    prisma.like.create({
      data: {
        userId: user1.id,
        memoryId: memories[2].id,
      },
    }),

    prisma.like.create({
      data: {
        userId: user2.id,
        memoryId: memories[3].id,
      },
    }),
  ])

  console.log('✅ Seed completado exitosamente!')
  console.log('')
  console.log('📊 Datos creados:')
  console.log(`- ${await prisma.user.count()} usuarios`)
  console.log(`- ${await prisma.category.count()} categorías`)
  console.log(`- ${await prisma.tag.count()} tags`)
  console.log(`- ${await prisma.memory.count()} memorias`)
  console.log(`- ${await prisma.comment.count()} comentarios`)
  console.log(`- ${await prisma.like.count()} likes`)
  console.log('')
  console.log('🔑 Credenciales de prueba:')
  console.log('Admin: admin@memoriaeterna.com / password123')
  console.log('Usuario 1: maria@example.com / password123')
  console.log('Usuario 2: juan@example.com / password123')
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
