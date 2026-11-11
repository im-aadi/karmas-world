import { describe, expect, it, vi } from 'vitest'
import type { PrismaClient } from '@prisma/client'
import type { Request, Response, NextFunction } from 'express'
import { requireAdministrator } from './router.js'

function responseMock() {
  const res = { status: vi.fn(), json: vi.fn() }
  res.status.mockReturnValue(res)
  return res
}

describe('administrator access control', () => {
  it('denies learners and allows admins based on the server-side account role', async () => {
    const findUnique = vi.fn().mockResolvedValue({ role: 'LEARNER' })
    const middleware = requireAdministrator({ user: { findUnique } } as unknown as PrismaClient)
    const req = { session: { userId: 'learner-id' } } as Request
    const res = responseMock()
    const next = vi.fn() as NextFunction
    await middleware(req, res as unknown as Response, next)
    expect(res.status).toHaveBeenCalledWith(403)
    expect(next).not.toHaveBeenCalled()

    findUnique.mockResolvedValue({ role: 'ADMIN' })
    await middleware(req, responseMock() as unknown as Response, next)
    expect(next).toHaveBeenCalledOnce()
  })

  it('requires a session before checking the role', async () => {
    const findUnique = vi.fn()
    const middleware = requireAdministrator({ user: { findUnique } } as unknown as PrismaClient)
    const res = responseMock()
    await middleware({ session: {} } as Request, res as unknown as Response, vi.fn())
    expect(res.status).toHaveBeenCalledWith(401)
    expect(findUnique).not.toHaveBeenCalled()
  })
})
