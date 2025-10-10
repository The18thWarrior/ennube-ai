// === auth0.ts ===
// Created: 2025-08-30 12:00
// Purpose: Minimal Auth0 Management API client for viewing and editing users from the admin-webapp
// Exports:
//   - export class Auth0Client
//   - export const auth0Client
// Interactions:
//   - Used by: server-side admin routes/services that need to manage Auth0 users
// Notes:
//   - Requires AUTH0_DOMAIN, AUTH0_MANAGEMENT_CLIENT_ID, AUTH0_MANAGEMENT_CLIENT_SECRET, AUTH0_AUDIENCE set in env

/**
 * OVERVIEW
 *
 * - Purpose: Provide a small, testable client for Auth0 Management API operations used by
 *   the admin webapp to view and manage Auth0 users.
 * - Assumptions:
 *   - This code runs server-side (Node environment) where environment variables are available.
 *   - The Auth0 application has the `read:users` and `update:users` (and optionally `delete:users`) scopes.
 * - Edge Cases:
 *   - Token fetching failures and HTTP errors are surfaced as thrown errors with body when available.
 *   - Token is cached in-memory for the lifetime of the server process and refreshed before expiry.
 * - Future improvements:
 *   - Add retry/backoff for transient network errors.
 *   - Add more specific TypeScript types for provider-specific user metadata.
 */

type Nullable<T> = T | null;

import { ManagementClient } from 'auth0';

export type Auth0User = {
  user_id: string;
  email?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  nickname?: string;
  picture?: string;
  created_at?: string;
  updated_at?: string;
  identities?: Array<Record<string, any>>;
  app_metadata?: Record<string, any>;
  user_metadata?: Record<string, any>;
  [key: string]: any;
};

export type ListUsersResult = {
  users: Auth0User[];
  total: number | null;
};

/** Minimal structured error for API failures */
export class Auth0Error extends Error {
  status: number | null;
  details: any;
  constructor(message: string, status: number | null = null, details: any = null) {
    super(message);
    this.name = 'Auth0Error';
    this.status = status;
    this.details = details;
  }
}

export class Auth0Client {
  private domain: string;
  private clientId: string;
  private clientSecret: string;
  private audience: string;
  private client: ManagementClient | null = null;

  constructor(opts?: {
    domain?: string;
    clientId?: string;
    clientSecret?: string;
    audience?: string;
  }) {
    this.domain = opts?.domain ?? process.env.AUTH0_DOMAIN ?? '';
    this.clientId = opts?.clientId ?? process.env.AUTH0_MANAGEMENT_CLIENT_ID ?? '';
    this.clientSecret = opts?.clientSecret ?? process.env.AUTH0_MANAGEMENT_CLIENT_SECRET ?? '';
    this.audience = opts?.audience ?? process.env.AUTH0_AUDIENCE ?? `https://${this.domain}/api/v2/`;

    if (!this.domain || !this.clientId || !this.clientSecret) {
      // Defer throwing until a method is used so unit tests can instantiate the client with mocks.
      // But still warn in console in dev.
      if (process.env.NODE_ENV !== 'test') {
        // eslint-disable-next-line no-console
        console.warn('Auth0Client: missing AUTH0_* env variables. Ensure AUTH0_DOMAIN, AUTH0_MANAGEMENT_CLIENT_ID and AUTH0_MANAGEMENT_CLIENT_SECRET are set.');
      }
    }
    // client will be lazily constructed when needed to avoid side-effects during import
  }
  private ensureClient(): void {
    if (this.client) return;
    console.log(this.domain, this.clientId, this.clientSecret)
    if (!this.domain || !this.clientId || !this.clientSecret) {
      throw new Auth0Error('Auth0 configuration missing (AUTH0_DOMAIN/CLIENT_ID/CLIENT_SECRET)', null, null);
    }

    // Use the same construction pattern as other packages in the repo
    this.client = new ManagementClient({
      domain: this.domain,
      clientId: this.clientId,
      clientSecret: this.clientSecret,
    } as any);
  }

  /** Get a single user by Auth0 user id (e.g. 'auth0|12345') */
  async getUser(userId: string): Promise<Auth0User> {
    if (!userId) throw new Auth0Error('getUser requires userId');
  this.ensureClient();
  const resp = await this.client!.users.get({ id: userId } as any);
  // Some auth0 SDK responses put user in `data`.
  return ((resp && (resp.data ?? resp)) as Auth0User) as Auth0User;
  }

  /**
   * List users
   * Supports minimal pagination using page/per_page and an optional query `q`.
   */
  async listUsers(opts?: { page?: number; perPage?: number; q?: string; includeTotals?: boolean }): Promise<ListUsersResult> {
    const { page = 0, perPage = 50, q = undefined, includeTotals = false } = opts ?? {};
    this.ensureClient();
    const params: Record<string, any> = { page, per_page: perPage, include_totals: includeTotals, search_engine: 'v3' };
    if (q) params.q = q;
    const res = await this.client!.users.getAll(params as any);
    // SDK may return { data: users, total }
    if (res && Array.isArray((res as any).data)) {
      return { users: (res as any).data as Auth0User[], total: typeof (res as any).total === 'number' ? (res as any).total : null };
    }
    // or it may return an array directly
    if (Array.isArray(res)) {
      return { users: res as Auth0User[], total: null };
    }
    return { users: [], total: null };
  }

  /** Update an Auth0 user. The `data` should be the patch body supported by Auth0 (e.g. { user_metadata: {...} }). */
  async updateUser(userId: string, data: Partial<Auth0User>): Promise<Auth0User> {
    if (!userId) throw new Auth0Error('updateUser requires userId');
    if (!data || Object.keys(data).length === 0) throw new Auth0Error('updateUser requires a non-empty data object');
  this.ensureClient();
  const resp = await this.client!.users.update({ id: userId } as any, data as any);
  return ((resp && (resp.data ?? resp)) as Auth0User) as Auth0User;
  }

  /** Delete a user by id */
  async deleteUser(userId: string): Promise<void> {
    if (!userId) throw new Auth0Error('deleteUser requires userId');
  this.ensureClient();
  await this.client!.users.delete({ id: userId } as any);
  }
}

// Export a default/shared client configured from environment variables. Tests can instantiate their own client.
export const auth0Client = new Auth0Client();

/*
 * === auth0.ts ===
 * Updated: 2025-08-30 12:00
 * Summary: Auth0 Management API helper used by admin-webapp to view/edit users.
 * Key Components:
 *   - Auth0Client: class with getUser, listUsers, updateUser, deleteUser
 *   - auth0Client: env-configured singleton
 * Dependencies:
 *   - Requires: environment variables AUTH0_DOMAIN, AUTH0_MANAGEMENT_CLIENT_ID, AUTH0_MANAGEMENT_CLIENT_SECRET, (optional AUTH0_AUDIENCE)
 * Version History:
 *   v1.0 – initial
 * Notes:
 *   - Keep token in-memory; serverless deployments should be aware token caching behaves per-instance.
 */
