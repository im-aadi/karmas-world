import { PrismaClient, DifficultyLevel } from '@prisma/client'
import { CYBERSECURITY_CATEGORIES, CATEGORY_DETAILS } from '../../packages/shared/src/index.js'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding cybersecurity categories, courses, and achievements...')

  // 1. Seed Categories
  for (const catId of CYBERSECURITY_CATEGORIES) {
    const details = CATEGORY_DETAILS[catId]
    const level = details.level as DifficultyLevel

    await prisma.category.upsert({
      where: { slug: details.id },
      update: {
        name: details.name,
        description: details.description,
        level,
        iconName: details.iconName,
      },
      create: {
        slug: details.id,
        name: details.name,
        description: details.description,
        level,
        iconName: details.iconName,
      },
    })
  }
  console.log(`✓ Seeded ${CYBERSECURITY_CATEGORIES.length} categories`)

  // 2. Seed Initial Core Achievements
  const achievements = [
    {
      slug: 'first-step',
      title: 'First Step',
      description: 'Completed your first cybersecurity lesson',
      icon: 'Award',
      xpValue: 100,
    },
    {
      slug: 'cadet-streak',
      title: 'Consistent Defender',
      description: 'Maintained an active 3-day learning streak',
      icon: 'Flame',
      xpValue: 200,
    },
    {
      slug: 'network-explorer',
      title: 'Packet Tracer',
      description: 'Completed the Networking and Packet Flow curriculum',
      icon: 'Network',
      xpValue: 300,
    },
    {
      slug: 'crypto-guard',
      title: 'Cipher Master',
      description: 'Completed all Cryptography & PKI modules',
      icon: 'KeyRound',
      xpValue: 400,
    },
    {
      slug: 'web-guardian',
      title: 'Web Sentry',
      description: 'Completed the Web Application Security path',
      icon: 'Globe',
      xpValue: 400,
    },
  ]

  for (const ach of achievements) {
    await prisma.achievement.upsert({
      where: { slug: ach.slug },
      update: {
        title: ach.title,
        description: ach.description,
        icon: ach.icon,
        xpValue: ach.xpValue,
      },
      create: {
        slug: ach.slug,
        title: ach.title,
        description: ach.description,
        icon: ach.icon,
        xpValue: ach.xpValue,
      },
    })
  }
  console.log(`✓ Seeded ${achievements.length} achievements`)

  console.log('Seeding completed successfully.')
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
