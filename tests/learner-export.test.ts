import { beforeEach, describe, expect, it } from 'vitest'
import { buildLocalLearningExport } from '../src/data/learnerExport'
import { readLearningProgress, saveLearningProgress, setProgressAccountId } from '../src/data/progress'
import { privateReflectionStorageKey } from '../src/data/reflections'

describe('learner data export', () => {
  beforeEach(() => {
    window.localStorage.clear()
    setProgressAccountId(null)
  })

  it('includes readable lesson names and reflections from only the active learner scope', () => {
    saveLearningProgress({ foundations: [0] })
    window.localStorage.setItem(privateReflectionStorageKey(null), JSON.stringify({ 'safer-spaces': 'Ask before resharing a message.' }))
    window.localStorage.setItem(privateReflectionStorageKey('other-learner'), JSON.stringify({ 'safer-spaces': 'A different private note.' }))

    const data = buildLocalLearningExport(readLearningProgress(), JSON.parse(window.localStorage.getItem(privateReflectionStorageKey(null))!), null, null)
    const foundations = data.learningPaths.find(path => path.courseId === 'foundations')
    expect(foundations?.completedLessons[0].title).toBe('What cybersecurity protects')
    expect(data.privateReflections['safer-spaces']).toBe('Ask before resharing a message.')
    expect(JSON.stringify(data)).not.toContain('A different private note')
  })
})
