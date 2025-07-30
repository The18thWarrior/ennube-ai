# Copilot Instructions for ennube-ai

## Project Overview
- **Framework:** Next.js (TypeScript)
- **Authentication:** NextAuth.js with Auth0 and Salesforce OAuth integrations
- **Major Integrations:** Salesforce (via JSForce), Stripe (subscriptions), Auth0
- **UI:** React components, Tailwind CSS, custom component library in `components/`

## Architecture & Key Patterns
- **App Directory:** Uses Next.js `app/` directory structure for routing and server/client components.
- **Authentication:**
  - Configured in `auth.ts` and `middleware.ts`.
  - Uses NextAuth.js for both server and client auth flows.
  - Salesforce OAuth and direct login supported (see `lib/salesforce.ts`, `lib/salesforce-client.ts`).
- **Integrations:**
  - Salesforce: All API calls via JSForce, logic in `lib/salesforce.ts` and `lib/salesforce-client.ts`.
  - Stripe: Subscription logic in `lib/stripe.ts`, context in `lib/stripe-context.tsx`.
- **UI Components:**
  - Shared components in `components/`, organized by feature (e.g., `chat/`, `agents/`, `billing/`).
  - Use `InputTextArea` for chat input, with Enter-to-submit UX (see `components/chat/chat-input.tsx`).
- **Hooks:**
  - Custom React hooks in `hooks/` for data fetching, integration state, and UI logic.

## Developer Workflows
- **Install:** `pnpm install`
- **Dev Server:** `pnpm run dev`
- **Build:** `pnpm run build`
- **Start (prod):** `pnpm run start`
- **Environment:** Copy `.env.local.example` to `.env.local` and fill in provider/secret values.
- **Salesforce Setup:** See README and `docs/STRIPE_INTEGRATION.md` for provider setup and callback URLs.

## Project Conventions
- **TypeScript everywhere** (including API and integration logic)
- **API calls**: Use server actions or API routes in `app/api/` for backend logic
- **Component structure:** Prefer colocating feature components (e.g., `components/chat/`)
- **Styling:** Tailwind CSS, with some custom CSS modules (e.g., `chat-input.module.css`)
- **Session management:** Use NextAuth.js session hooks and middleware for route protection

## Integration Points
- **Salesforce:**
  - OAuth and direct login flows
  - CRUD, SOQL, batch, analytics, metadata via JSForce
- **Stripe:**
  - Checkout, webhooks, and subscription status
- **Auth0:**
  - Provider for NextAuth.js

## Examples
- **Chat input with Enter-to-submit:** `components/chat/chat-input.tsx`
- **Salesforce API logic:** `lib/salesforce.ts`, `lib/salesforce-client.ts`
- **Stripe context/provider:** `lib/stripe-context.tsx`
- **Custom hooks:** `hooks/useProfile.ts`, `hooks/useIntegrationConnections.ts`

## References
- See `README.md` for setup, integration, and deployment details
- See `docs/STRIPE_INTEGRATION.md` for Stripe-specific setup
- See `mcp-config.json` for Model Context Protocol configuration

---

> Update this file as new conventions or integrations are added. For questions, see the README or ask a maintainer.
