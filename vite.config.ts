import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    proxy: { '/api': { target: 'http://127.0.0.1:4000', changeOrigin: false } },
  },
  test: { environment: 'jsdom', environmentOptions: { jsdom: { url: 'http://localhost/' } }, setupFiles: './tests/setup.ts', exclude: ['node_modules/**', 'server/**', 'dist/**'] },
})
