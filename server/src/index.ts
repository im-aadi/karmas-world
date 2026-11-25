import { PrismaClient } from '@prisma/client'
import { readConfig } from './config.js'
import { createApp } from './app.js'

const config = readConfig()
const prisma = new PrismaClient()
const app = createApp(prisma, config)

console.info(`Starting Karma's World API in [${config.NODE_ENV}] environment...`)
await prisma.$connect()
console.info('Database connection pool established successfully.')

const server = app.listen(config.PORT, () => {
  console.info(`Karma's World API listening on port ${config.PORT} (Origin: ${config.WEB_ORIGIN})`)
})

let isShuttingDown = false

export async function gracefulShutdown(signal: string, exitCode = 0) {
  if (isShuttingDown) return
  isShuttingDown = true
  console.info(`[Process] Received ${signal}. Draining active connections and shutting down gracefully...`)

  // Force exit safeguard if connection draining hangs
  const forceTimer = setTimeout(() => {
    console.error('[Process] Graceful shutdown timeout exceeded (10s). Forcing termination.')
    process.exit(1)
  }, 10000)
  forceTimer.unref()

  try {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()))
    })
    console.info('[HTTP] Closed HTTP listener and drained connection pool.')

    await prisma.$disconnect()
    console.info('[Database] Disconnected Prisma database client.')

    clearTimeout(forceTimer)
    console.info('[Process] Clean shutdown complete.')
    if (process.env.NODE_ENV !== 'test') {
      process.exit(exitCode)
    }
  } catch (err) {
    console.error('[Process] Error during graceful shutdown:', err)
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1)
    }
  }
}

process.on('SIGINT', () => void gracefulShutdown('SIGINT', 0))
process.on('SIGTERM', () => void gracefulShutdown('SIGTERM', 0))
process.on('unhandledRejection', (reason) => {
  console.error('[Process] Unhandled promise rejection:', reason)
})
process.on('uncaughtException', (error) => {
  console.error('[Process] Uncaught exception:', error)
  void gracefulShutdown('UNCAUGHT_EXCEPTION', 1)
})
