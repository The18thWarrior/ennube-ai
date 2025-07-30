'use client'
import type { DescribeGlobalResult } from 'jsforce/lib/types/common';
// IndexedDB utility for DescribeGlobalResult caching
const DB_NAME = 'SalesforceCacheDB';
const STORE_NAME = 'DescribeGlobalResult';
const DB_VERSION = 2;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = function (event) {
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

/**
 * Stores the DescribeGlobalResult in IndexedDB.
 * @param {DescribeGlobalResult} result
 * @returns {Promise<void>}
 */
export async function storeDescribeGlobalResult(result: DescribeGlobalResult): Promise<void> {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(result, 'describeGlobal');
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

/**
 * Retrieves the DescribeGlobalResult from IndexedDB.
 * @returns {Promise<import('jsforce/lib/types/common').DescribeGlobalResult|null>}
 */
export async function getDescribeGlobalResult() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get('describeGlobal');
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}
