import { build } from 'vite'
import { copyFileSync, writeFileSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const serverDir = __dirname

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
