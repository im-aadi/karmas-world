import { build } from 'vite'
import { copyFileSync, writeFileSync, readFileSync, cpSync, existsSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { createRequire } from 'node:module'

const __dirname = dirname(fileURLToPath(import.meta.url))
const serverDir = __dirname
const require = createRequire(join(serverDir, 'src/index.ts'))

console.log('Building server bundle with Vite SSR...')
await build({
  root: serverDir,
  build: {
    ssr: join(serverDir, 'src/index.ts'),
    outDir: join(serverDir, 'dist'),
    emptyOutDir: false,
    rollupOptions: {
      external: ['@prisma/client', 'argon2', 'pg-native']
    }
  },
  ssr: {
    noExternal: [
      'express',
      'cors',
      'helmet',
      'express-session',
      'connect-pg-simple',
      'express-rate-limit',
      'zod',
      'nodemailer',
      'dotenv',
      'pg'
    ]
  }
})

copyFileSync(join(serverDir, 'dist/index.js'), join(serverDir, 'dist/app.js'))

const targetNodeModules = join(serverDir, 'dist/node_modules')
mkdirSync(targetNodeModules, { recursive: true })

// Copy @prisma/client and .prisma into dist/node_modules
try {
  const prismaClientEntry = require.resolve('@prisma/client')
  const prismaClientDir = dirname(prismaClientEntry)
  const dotPrismaDir = join(prismaClientDir, '../../.prisma')

  if (existsSync(prismaClientDir)) {
    cpSync(prismaClientDir, join(targetNodeModules, '@prisma/client'), { recursive: true, dereference: true })
    console.log('Copied @prisma/client to dist/node_modules/@prisma/client')
  }
  if (existsSync(dotPrismaDir)) {
    cpSync(dotPrismaDir, join(targetNodeModules, '.prisma'), { recursive: true, dereference: true })
    console.log('Copied .prisma to dist/node_modules/.prisma')
  }
} catch (e) {
  console.warn('Prisma client packaging note:', e.message)
}

// Copy argon2 and its peer dependencies into dist/node_modules
try {
  const argon2Entry = require.resolve('argon2')
  const argon2NodeModulesDir = dirname(dirname(argon2Entry))
  if (existsSync(argon2NodeModulesDir)) {
    cpSync(argon2NodeModulesDir, targetNodeModules, { recursive: true, dereference: true })
    console.log('Copied argon2 and peer dependencies to dist/node_modules')
  }
} catch (e) {
  console.warn('Argon2 packaging note:', e.message)
}

const pkg = JSON.parse(readFileSync(join(serverDir, 'package.json'), 'utf8'))
writeFileSync(
  join(serverDir, 'dist/package.json'),
  JSON.stringify(
    {
      type: 'module',
      main: 'index.js',
      dependencies: pkg.dependencies
    },
    null,
    2
  )
)

console.log('Server bundle successfully created at server/dist.')
