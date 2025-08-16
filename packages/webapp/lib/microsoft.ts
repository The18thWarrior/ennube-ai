// === microsoft.ts ===
// Created: 2025-08-15 00:00
// Purpose: Wrapper utilities for Microsoft Graph API (OAuth helpers + client creation)
// Exports:
//   - createGraphClient
//   - getAuthUrl
//   - exchangeCodeForToken
//   - refreshAccessToken
// Interactions:
//   - Used by: app/api/microsoft/* routes and services
// Notes:
//   - Uses @microsoft/microsoft-graph-client for Graph calls
//   - Uses the v2.0 OAuth endpoints

/**
 * OVERVIEW
 *
 * - Purpose: Provide a small, testable wrapper around MS Graph auth and client creation.
 * - Assumptions: MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET are defined in env.
 * - Edge Cases: Network failures, token endpoint errors, invalid/missing env vars.
 * - Future Improvements: Switch to MSAL Node for robust token caching/rotation and PKCE flows for SPA.
 */

import { Client } from "@microsoft/microsoft-graph-client";
import "isomorphic-fetch"; // ensures fetch is available in Node environments

const MICROSOFT_AUTH_BASE = "https://login.microsoftonline.com/common/oauth2/v2.0";
const TOKEN_ENDPOINT = `${MICROSOFT_AUTH_BASE}/token`;
const AUTHORIZE_ENDPOINT = `${MICROSOFT_AUTH_BASE}/authorize`;

const DEFAULT_SCOPES = [
  "openid",
  "profile",
  "offline_access",
  "User.Read",
  "Mail.Send",
  "Calendars.ReadWrite",
].join(" ");

function getEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable ${name}`);
  return v;
}

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
}

export interface TokenResult {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  expiresAt?: number; // epoch ms
  scope?: string;
  raw: TokenResponse;
}

/**
 * Create a Microsoft Graph client that will call the Graph API using the provided access token.
 * The client uses the simple authProvider pattern required by @microsoft/microsoft-graph-client.
 */
export function createGraphClient({ accessToken }: { accessToken: string }) {
  if (!accessToken) throw new Error("accessToken is required to create Graph client");
  const client = Client.init({
    authProvider: (done) => {
      // done(err, accessToken)
      done(null, accessToken);
    },
  });
  return client;
}

/**
 * Build the Microsoft authorization URL to redirect users to the consent screen.
 * - state: optional string (recommended to prevent CSRF)
 * - redirectUri: must match the registered app redirect URI
 */
export function getAuthUrl({
  state,
  redirectUri,
  scopes = DEFAULT_SCOPES,
}: {
  state?: string;
  redirectUri: string;
  scopes?: string;
}) {
  const clientId = getEnv("MICROSOFT_CLIENT_ID");
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    response_mode: "query",
    scope: scopes,
  });
  if (state) params.set("state", state);
  // Prompt=consent ensures refresh_token is issued on some tenants; optional
  params.set("prompt", "consent");
  return `${AUTHORIZE_ENDPOINT}?${params.toString()}`;
}

async function postForm(url: string, body: Record<string, string>) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(body).toString(),
  });
  const json = (await res.json()) as TokenResponse;
  if (!res.ok || json.error) {
    const msg = json.error_description || json.error || `Token endpoint returned status ${res.status}`;
    throw new Error(`Microsoft token exchange failed: ${msg}`);
  }
  return json;
}

/**
 * Exchange an authorization code for tokens.
 */
export async function exchangeCodeForToken({
  code,
  redirectUri,
}: {
  code: string;
  redirectUri: string;
}): Promise<TokenResult> {
  const clientId = getEnv("MICROSOFT_CLIENT_ID");
  const clientSecret = getEnv("MICROSOFT_CLIENT_SECRET");

  const body: Record<string, string> = {
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  };

  const json = await postForm(TOKEN_ENDPOINT, body);
  const now = Date.now();
  const expiresAt = json.expires_in ? now + json.expires_in * 1000 : undefined;

  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    idToken: json.id_token,
    expiresAt,
    scope: json.scope,
    raw: json,
  };
}

/**
 * Refresh an access token using a refresh token.
 */
export async function refreshAccessToken({
  refreshToken,
}: {
  refreshToken: string;
}): Promise<TokenResult> {
  const clientId = getEnv("MICROSOFT_CLIENT_ID");
  const clientSecret = getEnv("MICROSOFT_CLIENT_SECRET");

  const body: Record<string, string> = {
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  };

  const json = await postForm(TOKEN_ENDPOINT, body);
  const now = Date.now();
  const expiresAt = json.expires_in ? now + json.expires_in * 1000 : undefined;

  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token || refreshToken,
    idToken: json.id_token,
    expiresAt,
    scope: json.scope,
    raw: json,
  };
}

/*
 * === microsoft.ts ===
 * Updated: 2025-08-15 00:00
 * Summary: Small wrapper for Microsoft Graph auth and client creation.
 * Key Components:
 *   - createGraphClient(): returns @microsoft/microsoft-graph-client Client
 *   - getAuthUrl(): builds the authorize URL for redirect
 *   - exchangeCodeForToken(): exchanges code for tokens and returns TokenResult
 *   - refreshAccessToken(): refreshes access token
 * Dependencies:
 *   - Requires: @microsoft/microsoft-graph-client, isomorphic-fetch
 * Version History:
 *   v1.0 – initial
 */
