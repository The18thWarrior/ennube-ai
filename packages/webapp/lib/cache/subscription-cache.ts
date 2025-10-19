import { Redis } from '@upstash/redis';
import type { SubscriptionStatus } from '../types';

// Configure your Upstash Redis connection here or via env vars
const redisUrl = process.env.KV_REST_API_URL || '';
const redisToken = process.env.KV_REST_API_TOKEN || '';
const redis = new Redis({
  url: redisUrl,
  token: redisToken,
});

const SUBSCRIPTION_PREFIX = 'subscription:user:'; // subscription:user:<subId>
const SUBSCRIPTION_INDEX = 'subscription:users'; // set containing all subIds

export interface ManualSubscriptionRecord {
  subId: string;
  subscription: SubscriptionStatus;
}

/**
 * ManualSubscriptionCache
 * - Stores manual subscription records in Upstash Redis under key: subscription:user:<subId>
 * - Provides CRUD operations and listing helpers
 */
export class ManualSubscriptionCache {
  private redis: Redis;

  constructor(redisClient: Redis = redis) {
    this.redis = redisClient;
  }

  private key(subId: string) {
    return SUBSCRIPTION_PREFIX + subId;
  }

  /** Create or replace a subscription record for a user */
  async upsert(record: ManualSubscriptionRecord): Promise<void> {
    const key = this.key(record.subId);
    await this.redis.set(key, JSON.stringify(record));
    // maintain index set of subIds
    try {
      await this.redis.sadd(SUBSCRIPTION_INDEX, record.subId);
    } catch {
      // ignore index maintenance errors
    }
  }

  /** Get subscription record by subId */
  async get(subId: string): Promise<ManualSubscriptionRecord | null> {
    const data = await this.redis.get<ManualSubscriptionRecord>(this.key(subId));
    if (!data) return null;
    try {
      return (typeof data === 'string' ? JSON.parse(data) : data) as ManualSubscriptionRecord;
    } catch {
      return null;
    }
  }

  /** Delete a subscription record by subId */
  async delete(subId: string): Promise<void> {
    await this.redis.del(this.key(subId));
    try {
      await this.redis.srem(SUBSCRIPTION_INDEX, subId);
    } catch {
      // ignore
    }
  }

  /** List multiple subscriptions for provided subIds */
  async mget(subIds: string[]): Promise<Array<ManualSubscriptionRecord | null>> {
    if (!subIds.length) return [];
    const keys = subIds.map((id) => this.key(id));
    const results = await this.redis.mget(...keys);
    return results.map((r) => {
      if (!r) return null;
      try {
        return (typeof r === 'string' ? JSON.parse(r) : r) as ManualSubscriptionRecord;
      } catch {
        return null;
      }
    });
  }

  /** Fetch all subscription keys (not recommended for large datasets) */
  async listAllKeys(pattern = SUBSCRIPTION_PREFIX + '*'): Promise<string[]> {
    // Read from index set if available
    try {
      const subIds = await this.redis.smembers(SUBSCRIPTION_INDEX);
      if (Array.isArray(subIds) && subIds.length) {
        return subIds.map((id) => SUBSCRIPTION_PREFIX + id);
      }
    } catch {
      // fallback to keys if available on client
    }

    try {
      // @ts-ignore - keys may or may not exist on client depending on plan
      const keys = await (this.redis as any).keys(pattern);
      return Array.isArray(keys) ? keys : [];
    } catch {
      return [];
    }
  }

  /** List all subscription records (use with caution) */
  async listAll(): Promise<ManualSubscriptionRecord[]> {
    // Use the indexed set to fetch subIds and then mget the actual keys
    try {
      const subIds = await this.redis.smembers(SUBSCRIPTION_INDEX);
      if (!Array.isArray(subIds) || subIds.length === 0) return [];
      const records = await this.mget(subIds);
      return records.filter((r): r is ManualSubscriptionRecord => r !== null);
    } catch {
      // fallback to key scanning
      const keys = await this.listAllKeys();
      if (!keys.length) return [];
      const results = await this.redis.mget(...keys);
      return results
        .map((r) => {
          if (!r) return null;
          try {
            return (typeof r === 'string' ? JSON.parse(r) : r) as ManualSubscriptionRecord;
          } catch {
            return null;
          }
        })
        .filter((x): x is ManualSubscriptionRecord => x !== null);
    }
  }

  /** Helper to set only the subscription object for a user (preserving subId) */
  async setSubscription(subId: string, subscription: SubscriptionStatus): Promise<void> {
    await this.upsert({ subId, subscription });
  }

  /** Helper to get only the subscription object for a user */
  async getSubscription(subId: string): Promise<SubscriptionStatus | null> {
    const rec = await this.get(subId);
    return rec ? rec.subscription : null;
  }
}

export default new ManualSubscriptionCache();

/*
 * === subscription-cache.ts ===
 * Created: 2025-10-18
 * Purpose: Cache for manual subscription records backed by Upstash Redis
 * Exports:
 *  - ManualSubscriptionCache class
 *  - default instance
 * Notes:
 *  - Keys: subscription:user:<subId>
 *  - Uses environment vars KV_REST_API_URL and KV_REST_API_TOKEN
 */
