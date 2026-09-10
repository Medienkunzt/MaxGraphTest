import type { JsonObject } from '@/services/api/types/common'

export interface StoredWorkspaceDraft {
  key: string
  baseVersionId: string | null
  savedAt: string
  payload: JsonObject
}

const DB_NAME = 'model-workspace-recovery'
const STORE = 'drafts'

const openDb = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: 'key' })
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })

export const readDraft = async (key: string): Promise<StoredWorkspaceDraft | null> => {
  const db = await openDb()
  return await new Promise((resolve, reject) => {
    const request = db.transaction(STORE, 'readonly').objectStore(STORE).get(key)
    request.onsuccess = () => resolve((request.result as StoredWorkspaceDraft | undefined) ?? null)
    request.onerror = () => reject(request.error)
  })
}

export const writeDraft = async (draft: StoredWorkspaceDraft) => {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const request = db.transaction(STORE, 'readwrite').objectStore(STORE).put(draft)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export const removeDraft = async (key: string) => {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const request = db.transaction(STORE, 'readwrite').objectStore(STORE).delete(key)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}
