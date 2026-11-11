import { PrismaClient } from '@prisma/client'
import { readConfig } from './config.js'
import { createApp } from './app.js'

const config = readConfig()
const prisma = new PrismaClient()
const app = createApp(prisma, config)

await prisma.$connect()
const server = app.listen(config.PORT, () => console.info(`Karma's World API listening on port ${config.PORT}`))

async function shutdown() {
  server.close()
  await prisma.$disconnect()
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
