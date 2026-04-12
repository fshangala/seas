export type IDBResponse = {
  question_id: string
  submission_id: string
  selected_option_id?: string
  text_value?: string
  image_response_blob?: Blob
  image_response_url?: string
  synced: boolean
  updated_at: number
}

export type IDBLog = {
  timestamp: number
  event: string
  details?: string
  synced: boolean
}

const DB_NAME = 'seas_db'
const DB_VERSION = 1

export class IDBService {
  private _db: IDBDatabase | null = null

  get db(): IDBDatabase | null {
    return this._db
  }

  async init(): Promise<void> {
    if (this._db) return

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        
        if (!db.objectStoreNames.contains('student_responses')) {
          db.createObjectStore('student_responses', { keyPath: 'question_id' })
        }
        
        if (!db.objectStoreNames.contains('proctoring_logs')) {
          db.createObjectStore('proctoring_logs', { keyPath: 'timestamp' })
        }

        if (!db.objectStoreNames.contains('assessment_cache')) {
          db.createObjectStore('assessment_cache', { keyPath: 'id' })
        }
      }

      request.onsuccess = (event) => {
        this._db = (event.target as IDBOpenDBRequest).result
        resolve()
      }

      request.onerror = (event) => {
        reject((event.target as IDBOpenDBRequest).error)
      }
    })
  }

  async saveResponse(response: IDBResponse): Promise<void> {
    await this.init()
    return new Promise((resolve, reject) => {
      const transaction = this._db!.transaction(['student_responses'], 'readwrite')
      const store = transaction.objectStore('student_responses')
      const request = store.put(response)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getResponses(): Promise<IDBResponse[]> {
    await this.init()
    return new Promise((resolve, reject) => {
      const transaction = this._db!.transaction(['student_responses'], 'readonly')
      const store = transaction.objectStore('student_responses')
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async clearResponses(): Promise<void> {
    await this.init()
    return new Promise((resolve, reject) => {
      const transaction = this._db!.transaction(['student_responses'], 'readwrite')
      const store = transaction.objectStore('student_responses')
      const request = store.clear()

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async addLog(log: IDBLog): Promise<void> {
    await this.init()
    return new Promise((resolve, reject) => {
      const transaction = this._db!.transaction(['proctoring_logs'], 'readwrite')
      const store = transaction.objectStore('proctoring_logs')
      const request = store.add(log)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getLogs(): Promise<IDBLog[]> {
    await this.init()
    return new Promise((resolve, reject) => {
      const transaction = this._db!.transaction(['proctoring_logs'], 'readonly')
      const store = transaction.objectStore('proctoring_logs')
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }
}

export const idb = new IDBService()
