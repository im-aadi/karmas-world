export type PrivateReflections = Record<string, string>

export function privateReflectionStorageKey(accountId: string | null) {
  return `karma-private-reflections-v1:${accountId ? `account:${accountId}` : 'guest'}`
}

export function readPrivateReflections(accountId: string | null): PrivateReflections {
  try { return JSON.parse(window.localStorage.getItem(privateReflectionStorageKey(accountId)) ?? '{}') as PrivateReflections } catch { return {} }
}

export function clearPrivateReflections(accountId: string) {
  try {
    window.localStorage.removeItem(privateReflectionStorageKey(accountId))
    return true
  } catch { return false }
}
