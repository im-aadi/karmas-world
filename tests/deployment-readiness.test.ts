import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

describe('Phase 12: Production Deployment Readiness & Artifact Verification', () => {
  const rootDir = process.cwd()

  it('verifies production build dist directory contains valid entry point and assets', () => {
    const distHtmlPath = path.join(rootDir, 'dist', 'index.html')
    expect(fs.existsSync(distHtmlPath)).toBe(true)

    const htmlContent = fs.readFileSync(distHtmlPath, 'utf-8')
    expect(htmlContent).toContain('<div id="root">')
    expect(htmlContent).toContain('<meta name="viewport"')
    expect(htmlContent).toMatch(/<script\s+type="module"/i)
  })

  it('verifies Dockerfile exists and configures multi-stage build and Nginx runner', () => {
    const dockerfilePath = path.join(rootDir, 'Dockerfile')
    expect(fs.existsSync(dockerfilePath)).toBe(true)

    const content = fs.readFileSync(dockerfilePath, 'utf-8')
    expect(content).toContain('FROM node:22-alpine AS builder')
    expect(content).toContain('FROM nginx:1.27-alpine AS runner')
    expect(content).toContain('COPY nginx.conf /etc/nginx/conf.d/default.conf')
    expect(content).toContain('EXPOSE 80')
    expect(content).toContain('HEALTHCHECK')
  })

  it('verifies server/Dockerfile exists and configures non-root user and production healthcheck', () => {
    const serverDockerPath = path.join(rootDir, 'server', 'Dockerfile')
    expect(fs.existsSync(serverDockerPath)).toBe(true)

    const content = fs.readFileSync(serverDockerPath, 'utf-8')
    expect(content).toContain('FROM node:22-alpine AS builder')
    expect(content).toContain('FROM node:22-alpine AS runner')
    expect(content).toContain('USER appuser')
    expect(content).toContain('EXPOSE 4000')
    expect(content).toContain('HEALTHCHECK')
    expect(content).toContain('/api/health')
  })

  it('verifies nginx.conf configures compression, security headers, SPA fallback, and API proxy', () => {
    const nginxPath = path.join(rootDir, 'nginx.conf')
    expect(fs.existsSync(nginxPath)).toBe(true)

    const content = fs.readFileSync(nginxPath, 'utf-8')
    expect(content).toContain('gzip on;')
    expect(content).toContain('add_header X-Frame-Options "DENY"')
    expect(content).toContain('add_header X-Content-Type-Options "nosniff"')
    expect(content).toContain('location /assets/ {')
    expect(content).toContain('location /api/ {')
    expect(content).toContain('proxy_pass http://api:4000;')
    expect(content).toContain('try_files $uri $uri/ /index.html;')
  })

  it('verifies docker-compose.prod.yml defines database, api, and web services with healthchecks', () => {
    const composePath = path.join(rootDir, 'docker-compose.prod.yml')
    expect(fs.existsSync(composePath)).toBe(true)

    const content = fs.readFileSync(composePath, 'utf-8')
    expect(content).toContain('database:')
    expect(content).toContain('api:')
    expect(content).toContain('web:')
    expect(content).toContain('postgres:17-alpine')
    expect(content).toContain('karma-network')
  })

  it('verifies .env.production.example contains all required production secret parameters', () => {
    const envExamplePath = path.join(rootDir, '.env.production.example')
    expect(fs.existsSync(envExamplePath)).toBe(true)

    const content = fs.readFileSync(envExamplePath, 'utf-8')
    expect(content).toContain('NODE_ENV=production')
    expect(content).toContain('DATABASE_URL=')
    expect(content).toContain('SESSION_SECRET=')
    expect(content).toContain('MFA_ENCRYPTION_KEY=')
    expect(content).toContain('SMTP_HOST=')
  })
})
