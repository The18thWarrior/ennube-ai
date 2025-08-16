# Microsoft 365 Integration Plan

Overview
--------
This document outlines a concrete plan to add Microsoft 365 (Graph API) integration to the webapp. It mirrors the existing Google (gsuite) integration under `app/api/gsuite` and follows the repository conventions for storage, API routes, and service wrappers.

Goals
-----
- Provide OAuth2 flow for Microsoft accounts (users grant app access)
- Store user credentials securely in Postgres `credentials` table
- Expose API routes for Calendar (events), Mail (send/search), userinfo, and credential management
- Use `@microsoft/microsoft-graph-client` as the primary SDK to call Microsoft Graph
- Implement a small `lib/microsoft.ts` wrapper for authentication and client creation
- Provide `lib/db/microsoft-storage.ts` for reading/writing credentials per user
- Tests, documentation, and migration guidance

Assumptions
-----------
- Environment variables `MICROSOFT_CLIENT_ID` and `MICROSOFT_CLIENT_SECRET` are set.
- Existing database schema contains a `credentials` table used for other integrations (e.g., Google). We will extend or reuse it.
- The Graph API scopes required include calendar, mail, offline_access, openid, profile, email, and user.read for basic profile.

High-level file/tasks
---------------------
- lib/microsoft.ts (new) — wrapper to create authenticated Graph client and helper functions.
- lib/db/microsoft-storage.ts (new) — CRUD helpers for storing Microsoft credentials in `credentials` table for a given user.
- app/api/microsoft/oauth2/authorize/route.ts (new) — redirect users to Microsoft OAuth consent screen.
- app/api/microsoft/oauth2/callback/route.ts (new) — handle OAuth callback, exchange code for tokens, persist credentials.
- app/api/microsoft/calendar/events/route.ts (new) — list/create calendar events.
- app/api/microsoft/mail/send/route.ts (new) — send email via Graph.
- app/api/microsoft/gmail/search/route.ts (if needed) — search mail (name parity with gsuite structure).
- app/api/microsoft/userinfo/route.ts (new) — fetch basic profile info for signed-in user.
- lib/db/migrations/XXXX_add_microsoft_credentials.sql (new) — migration to add provider-specific metadata if necessary.
- tests/ — unit tests for storage and lib wrappers.

API route shape (example) — mirrored from `app/api/gsuite`
-----------------------------------------------------------
- /api/microsoft/oauth2/authorize
  - Method: GET
  - Query/redirect: optional `returnTo`
  - Behavior: constructs authorization URL with scopes and redirects user to Microsoft consent screen.

- /api/microsoft/oauth2/callback
  - Method: GET
  - Query params: `code`, `state`, `error` from Microsoft
  - Behavior: exchange code for tokens (access_token, refresh_token, id_token), store tokens in `credentials` table associated with the local user, redirect to app UI.

- /api/microsoft/calendar/events
  - Methods: GET (list), POST (create)
  - Auth: server checks `credentials` table for the user and uses stored refresh_token/access_token to create a Graph client.

- /api/microsoft/mail/send
  - Method: POST
  - Body: { to: string[], subject: string, body: string }
  - Behavior: send mail via Graph's /me/sendMail endpoint using client from `lib/microsoft.ts`.

- /api/microsoft/userinfo
  - Method: GET
  - Behavior: return profile data fetched from Graph (/me) or from stored id_token claims.

lib/microsoft.ts (contract)
---------------------------
- Exports:
  - createGraphClient({ accessToken }: { accessToken: string }) => Client
  - getAuthUrl({ state, redirectUri }) => string
  - exchangeCodeForToken({ code, redirectUri }) => { access_token, refresh_token, id_token, expires_in }
  - refreshAccessToken({ refreshToken }) => { access_token, refresh_token?, expires_in }

- Implementation notes:
  - Use `@microsoft/microsoft-graph-client` for requests.
  - Use `node-fetch` or the browser fetch API if available for token exchange.
  - Follow MSAL vs raw OAuth tradeoffs: keep token exchange light; MSAL Node could be introduced later if needed.

lib/db/microsoft-storage.ts (contract)
--------------------------------------
- Functions:
  - getMicrosoftCredentialsForUser(userId: string) => returns stored credential row or null
  - upsertMicrosoftCredentials(userId: string, data: { access_token, refresh_token, expires_at, scope, provider, provider_user_id, raw }) => saved row
  - deleteMicrosoftCredentials(userId: string)

- Storage details:
  - `credentials` table columns used: id, user_id, provider, access_token, refresh_token, expires_at (timestamp), raw (json), created_at, updated_at
  - provider value: 'microsoft'

Security and Token Handling
---------------------------
- Never log raw tokens.
- Store tokens encrypted if possible (future improvement). For now, keep tokens in DB, not in logs.
- Refresh access tokens automatically in server API routes when expired.

DB Migration (example)
----------------------
- If `credentials` table already matches other providers, no change required; otherwise add columns:
  - provider VARCHAR
  - access_token TEXT
  - refresh_token TEXT
  - expires_at TIMESTAMP
  - raw JSONB

Testing
-------
- Unit test `lib/db/microsoft-storage.ts` with mocked DB client.
- Unit test `lib/microsoft.ts` functions with nock or msw to mock token endpoints and Graph calls.
- Integration test for OAuth flow is manual (requires Microsoft dev tenant). Provide a checklist for QA.

Timeline & Estimated Effort
---------------------------
- Plan + design: 1 day
- Storage & library wrapper + unit tests: 1-2 days
- API routes (oauth, callback, calendar, mail, userinfo): 1-2 days
- Migrations & docs: 0.5 day
- Manual QA and fixes: 1 day

Rollout Steps
-------------
1. Implement `lib/microsoft.ts` and `lib/db/microsoft-storage.ts` with unit tests.
2. Implement oauth authorize & callback routes and ensure tokens persist.
3. Implement calendar and mail routes.
4. Add UI components if needed to connect accounts.
5. Run manual QA with Microsoft test tenant and update docs.

Open questions / decisions
-------------------------
- Use MSAL Node library vs raw OAuth token exchange? MSAL provides robust token caching and refresh but adds dependency and complexity.
- Encrypt tokens at rest? For now, store as plain text in DB; plan add encryption later.
- Scopes defaults: choose minimal scopes first: openid profile offline_access User.Read Mail.Send Calendars.ReadWrite

Appendix: Example env vars
-------------------------
- MICROSOFT_CLIENT_ID
- MICROSOFT_CLIENT_SECRET
- MICROSOFT_REDIRECT_URI (if different environments need explicit override)

Contacts
--------
- Integration owner: @your-team
- Reviewer: @security


---

Completed: initial plan draft.
