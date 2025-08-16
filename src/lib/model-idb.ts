/*
  Simple IndexedDB utilities for storing model blobs by model value.
*/

export type StoredModelRecord = {
  value: string
  label?: string
  blob: Blob
  size: number
  createdAt: number
}

const DB_NAME = "toolkit-models"
const DB_VERSION = 1
const STORE_NAME = "models"

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "value" })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function putModel(record: StoredModelRecord): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite")
    const store = tx.objectStore(STORE_NAME)
    store.put(record)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
  db.close()
}

export async function getModel(value: string): Promise<StoredModelRecord | undefined> {
  const db = await openDb()
  const result = await new Promise<StoredModelRecord | undefined>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly")
    const store = tx.objectStore(STORE_NAME)
    const req = store.get(value)
    req.onsuccess = () => resolve(req.result as StoredModelRecord | undefined)
    req.onerror = () => reject(req.error)
  })
  db.close()
  return result
}

export async function deleteModel(value: string): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite")
    const store = tx.objectStore(STORE_NAME)
    store.delete(value)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
  db.close()
}

export async function hasModel(value: string): Promise<boolean> {
  const record = await getModel(value)
  return Boolean(record)
}

export async function listModels(): Promise<string[]> {
  const db = await openDb()
  const keys: string[] = []
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly")
    const store = tx.objectStore(STORE_NAME)
    const req = store.openCursor()
    req.onsuccess = () => {
      const cursor = req.result
      if (cursor) {
        keys.push(cursor.key as string)
        cursor.continue()
      } else {
        resolve()
      }
    }
    req.onerror = () => reject(req.error)
  })
  db.close()
  return keys
}
