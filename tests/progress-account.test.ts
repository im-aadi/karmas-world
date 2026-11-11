import { beforeEach, describe, expect, it } from 'vitest'
import { clearAccountLearningProgress, progressStorageKey, readLearningProgress, saveLearningProgress, setProgressAccountId } from '../src/data/progress'
import { clearPrivateReflections, privateReflectionStorageKey } from '../src/data/reflections'

describe('account progress storage', () => {
  beforeEach(() => {
    window.localStorage.clear()
    setProgressAccountId(null)
  })

  it('keeps guest and account progress separate when switching learners', () => {
    saveLearningProgress({ foundations: [0] })
    setProgressAccountId('learner-one')
    expect(readLearningProgress()).toEqual({})
    saveLearningProgress({ networks: [1] })

    setProgressAccountId('learner-two')
    expect(readLearningProgress()).toEqual({})
    setProgressAccountId('learner-one')
    expect(readLearningProgress()).toEqual({ networks: [1] })
    setProgressAccountId(null)
    expect(readLearningProgress()).toEqual({ foundations: [0] })
  })

  it('clears only the deleted account’s browser progress and private reflections', () => {
    setProgressAccountId('learner-one')
    saveLearningProgress({ foundations: [0, 1] })
    window.localStorage.setItem(privateReflectionStorageKey('learner-one'), JSON.stringify({ 'safer-spaces': 'private note' }))
    setProgressAccountId(null)
    saveLearningProgress({ foundations: [2] })

    expect(clearAccountLearningProgress('learner-one')).toBe(true)
    expect(clearPrivateReflections('learner-one')).toBe(true)
    setProgressAccountId('learner-one')
    expect(readLearningProgress()).toEqual({})
    expect(window.localStorage.getItem(privateReflectionStorageKey('learner-one'))).toBeNull()
    setProgressAccountId(null)
    expect(readLearningProgress()).toEqual({ foundations: [2] })
    expect(window.localStorage.getItem(progressStorageKey)).not.toBeNull()
  })
})
