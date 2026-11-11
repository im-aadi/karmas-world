export type LearningProgress = Record<string, number[]>
export const progressStorageKey = 'karma-learning-progress-v1'
export const learningProgressEvent = 'karma-learning-progress-updated'
let activeProgressStorageKey = progressStorageKey

export function setProgressAccountId(userId: string | null) {
  activeProgressStorageKey = userId ? `${progressStorageKey}:account:${userId}` : progressStorageKey
  window.dispatchEvent(new Event(learningProgressEvent))
}

export function clearAccountLearningProgress(userId: string) {
  try {
    window.localStorage.removeItem(`${progressStorageKey}:account:${userId}`)
    return true
  } catch { return false }
}

export function readLearningProgress(): LearningProgress {
  try {
    const value = window.localStorage.getItem(activeProgressStorageKey)
    return value ? JSON.parse(value) as LearningProgress : {}
  } catch {
    return {}
  }
}

export function saveLearningProgress(progress: LearningProgress) {
  try {
    window.localStorage.setItem(activeProgressStorageKey, JSON.stringify(progress))
  } catch {
    // Progress remains available in memory for this session.
  }
  window.dispatchEvent(new Event(learningProgressEvent))
}
