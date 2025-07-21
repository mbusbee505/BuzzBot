import { prisma } from './db'

export async function seedDefaultUser() {
  try {
    const defaultUser = await prisma.user.upsert({
      where: { id: 'default-user' },
      update: {},
      create: {
        id: 'default-user',
        email: 'user@buzzbot.ai',
        name: 'User'
      }
    })
    console.log('Default user created:', defaultUser)
    return defaultUser
  } catch (error) {
    console.error('Error seeding default user:', error)
  }
}

// Run if this file is executed directly
if (require.main === module) {
  seedDefaultUser()
    .then(() => {
      console.log('Seeding completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Seeding failed:', error)
      process.exit(1)
    })
} 