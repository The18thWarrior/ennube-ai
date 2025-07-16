// IndexedDB utility for storing and retrieving Salesforce records by ID
export interface SfdcRecordCachePayload {
  updatedAt: number;
  record: any; // CrmRecordSummary
  sobject: string;
}

const DB_NAME = 'SalesforceCacheDB';
const STORE_NAME = 'SfdcRecord';
const DB_VERSION = 2;

function openRecordDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = function () {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = function () {
      resolve(request.result);
    };
    request.onerror = function () {
      reject(request.error);
    };
  });
}

export async function storeSfdcRecord(id: string, payload: SfdcRecordCachePayload): Promise<void> {
  const db = await openRecordDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(payload, `sfdc:record:${id}`);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

export async function getSfdcRecord(id: string): Promise<SfdcRecordCachePayload | null> {
  const db = await openRecordDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(`sfdc:record:${id}`);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}
