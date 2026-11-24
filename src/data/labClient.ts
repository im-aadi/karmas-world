import type { LabType, DifficultyLevel, CybersecurityCategory } from '../../packages/shared/src/index'
import { CURATED_LABS, type DetailedLab } from './labs'

export interface LabSummary {
  id: string
  slug: string
  title: string
  description: string
  categorySlug: CybersecurityCategory
  difficulty: DifficultyLevel
  duration: string
  xpReward: number
  type: LabType
  totalTasks: number
  totalPoints: number
  attempt: {
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'
    completedTasks: string[]
    xpAwarded: number
  }
}

export interface VerifyFlagResponse {
  success: boolean
  message: string
  taskCompleted: boolean
  alreadyCompleted?: boolean
  allCompleted?: boolean
  pointsEarned?: number
  completedTasks?: string[]
  totalXpAwarded?: number
}

const LOCAL_LABS_STORAGE_KEY = 'kw_local_lab_attempts_v1'

function getLocalAttempts(): Record<string, { status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'; completedTasks: string[]; xpAwarded: number }> {
  try {
    const raw = localStorage.getItem(LOCAL_LABS_STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, { status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'; completedTasks: string[]; xpAwarded: number }>
  } catch {
    return {}
  }
}

function saveLocalAttempts(data: Record<string, { status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'; completedTasks: string[]; xpAwarded: number }>) {
  try {
    localStorage.setItem(LOCAL_LABS_STORAGE_KEY, JSON.stringify(data))
  } catch {
    // Ignore storage quota errors in sandbox
  }
}

export async function fetchLabs(filters?: { category?: string; difficulty?: string; q?: string }): Promise<LabSummary[]> {
  try {
    const params = new URLSearchParams()
    if (filters?.category) params.set('category', filters.category)
    if (filters?.difficulty) params.set('difficulty', filters.difficulty)
    if (filters?.q) params.set('q', filters.q)

    const res = await fetch(`/api/labs?${params.toString()}`)
    if (res.ok) {
      const data = await res.json()
      return data.labs
    }
  } catch {
    // API unavailable - fall through to curated local data
  }

  // Fallback to CURATED_LABS
  const localAttempts = getLocalAttempts()
  let list = CURATED_LABS

  if (filters?.category && filters.category !== 'all') {
    list = list.filter((l) => l.category === filters.category)
  }
  if (filters?.difficulty && filters.difficulty !== 'ALL') {
    list = list.filter((l) => l.difficulty === filters.difficulty)
  }
  if (filters?.q) {
    const qLower = filters.q.toLowerCase()
    list = list.filter((l) => l.title.toLowerCase().includes(qLower) || l.description.toLowerCase().includes(qLower))
  }

  return list.map((l) => {
    const attempt = localAttempts[l.slug] ?? {
      status: 'NOT_STARTED',
      completedTasks: [],
      xpAwarded: 0,
    }
    const totalPoints = l.tasks.reduce((sum, t) => sum + t.points, 0)
    return {
      id: l.id,
      slug: l.slug,
      title: l.title,
      description: l.description,
      categorySlug: l.category,
      difficulty: l.difficulty,
      duration: l.duration,
      xpReward: l.xpReward,
      type: l.type,
      totalTasks: l.tasks.length,
      totalPoints,
      attempt,
    }
  })
}

export async function fetchLabDetails(slug: string): Promise<DetailedLab | null> {
  const localMatch = CURATED_LABS.find((l) => l.slug === slug)
  if (!localMatch) return null

  try {
    const res = await fetch(`/api/labs/${slug}`)
    if (res.ok) {
      const data = await res.json()
      return {
        ...localMatch,
        ...data.lab,
        simulatedData: localMatch.simulatedData,
        targetEnvironment: localMatch.targetEnvironment,
        scenarioDescription: localMatch.scenarioDescription,
      }
    }
  } catch {
    // API unavailable
  }

  return {
    ...localMatch,
    tasks: localMatch.tasks,
  }
}

export async function startLabAttempt(slug: string, csrfToken?: string): Promise<{ success: boolean }> {
  if (csrfToken) {
    try {
      const res = await fetch(`/api/labs/${slug}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
      })
      if (res.ok) return { success: true }
    } catch {
      // Fallback to local
    }
  }

  const local = getLocalAttempts()
  if (!local[slug] || local[slug].status === 'NOT_STARTED') {
    local[slug] = { status: 'IN_PROGRESS', completedTasks: [], xpAwarded: 0 }
    saveLocalAttempts(local)
  }
  return { success: true }
}

export async function verifyLabFlag(slug: string, taskId: string, flag: string, csrfToken?: string): Promise<VerifyFlagResponse> {
  if (csrfToken) {
    try {
      const res = await fetch(`/api/labs/${slug}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        body: JSON.stringify({ taskId, flag }),
      })
      if (res.ok) {
        const data = await res.json()
        return data
      }
    } catch {
      // Fallback to local evaluation
    }
  }

  // Local fallback validation
  const lab = CURATED_LABS.find((l) => l.slug === slug)
  if (!lab) return { success: false, message: 'Lab not found', taskCompleted: false }

  const task = lab.tasks.find((t) => t.id === taskId)
  if (!task) return { success: false, message: 'Task not found', taskCompleted: false }

  const trimmedSubmitted = flag.trim()
  if (trimmedSubmitted !== task.flag.trim()) {
    return {
      success: false,
      message: 'Incorrect flag or answer. Review the hint and inspect the simulation environment.',
      taskCompleted: false,
    }
  }

  const local = getLocalAttempts()
  const attempt = local[slug] ?? { status: 'IN_PROGRESS', completedTasks: [], xpAwarded: 0 }
  const existingCompleted = attempt.completedTasks || []

  if (existingCompleted.includes(taskId)) {
    return {
      success: true,
      message: 'Task already completed.',
      taskCompleted: true,
      alreadyCompleted: true,
      allCompleted: attempt.status === 'COMPLETED',
      completedTasks: existingCompleted,
      pointsEarned: 0,
      totalXpAwarded: attempt.xpAwarded,
    }
  }

  const updatedCompleted = [...existingCompleted, taskId]
  const isAllCompleted = updatedCompleted.length >= lab.tasks.length
  const pointsEarned = task.points + (isAllCompleted ? lab.xpReward : 0)
  const newXp = attempt.xpAwarded + pointsEarned

  local[slug] = {
    status: isAllCompleted ? 'COMPLETED' : 'IN_PROGRESS',
    completedTasks: updatedCompleted,
    xpAwarded: newXp,
  }
  saveLocalAttempts(local)

  return {
    success: true,
    message: isAllCompleted
      ? `Outstanding! You conquered all tasks in ${lab.title} and earned a ${lab.xpReward} XP completion bonus!`
      : `Flag verified! Earned ${task.points} XP for ${task.title}.`,
    taskCompleted: true,
    alreadyCompleted: false,
    allCompleted: isAllCompleted,
    pointsEarned,
    completedTasks: updatedCompleted,
    totalXpAwarded: newXp,
  }
}

export async function resetLabWorkspace(slug: string, csrfToken?: string): Promise<{ success: boolean }> {
  if (csrfToken) {
    try {
      await fetch(`/api/labs/${slug}/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
      })
    } catch {
      // Ignore
    }
  }

  const local = getLocalAttempts()
  delete local[slug]
  saveLocalAttempts(local)
  return { success: true }
}
