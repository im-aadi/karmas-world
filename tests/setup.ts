import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

const testStorage = new Map<string, string>()
const storage = {
  getItem: (key: string) => testStorage.get(key) ?? null,
  setItem: (key: string, value: string) => { testStorage.set(key, String(value)) },
  removeItem: (key: string) => { testStorage.delete(key) },
  clear: () => { testStorage.clear() },
  key: (index: number) => [...testStorage.keys()][index] ?? null,
  get length() { return testStorage.size },
}
Object.defineProperty(window, 'localStorage', { configurable: true, value: storage })

afterEach(cleanup)
