import { Router } from 'express'
import type { PrismaClient } from '@prisma/client'

export function newsRouter(prisma: PrismaClient) {
  const router = Router()
  router.get('/', async (_req, res, next) => {
    try {
      const updates = await prisma.securityUpdate.findMany({
        where: { status: 'PUBLISHED' }, orderBy: { sourcePublishedAt: 'desc' }, take: 30,
        select: { id: true, source: true, type: true, title: true, sourceUrl: true, sourcePublishedAt: true, summary: true, takeaway: true, verifiedAt: true },
      })
      res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
      res.json({ updates })
    } catch (error) { next(error) }
  })
  return router
}
