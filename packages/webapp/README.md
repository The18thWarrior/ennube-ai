> The example repository is maintained from a [monorepo](https://github.com/nextauthjs/next-auth/tree/main/apps/examples/nextjs). Pull Requests should be opened against [`nextauthjs/next-auth`](https://github.com/nextauthjs/next-auth).

<p align="center">
   <br/>
   <a href="https://authjs.dev" target="_blank"><img width="150px" src="https://authjs.dev/img/logo-sm.png" /></a>
   <h3 align="center">NextAuth.js Example App</h3>
   <p align="center">
   Open Source. Full Stack. Own Your Data.
   </p>
   <p align="center" style="align: center;">
      <a href="https://npm.im/next-auth">
        <img alt="npm" src="https://img.shields.io/npm/v/next-auth?color=green&label=next-auth">
      </a>
      <a href="https://bundlephobia.com/result?p=next-auth-example">
        <img src="https://img.shields.io/bundlephobia/minzip/next-auth?label=next-auth" alt="Bundle Size"/>
      </a>
      <a href="https://www.npmtrends.com/next-auth">
        <img src="https://img.shields.io/npm/dm/next-auth?label=next-auth%20downloads" alt="Downloads" />
      </a>
      <a href="https://npm.im/next-auth">
        <img src="https://img.shields.io/badge/npm-TypeScript-blue" alt="TypeScript" />
      </a>
   </p>
</p>

## Overview

NextAuth.js is a complete open source authentication solution.

This is an example application that shows how `next-auth` is applied to a basic Next.js app.

It includes:
- Basic authentication with Auth0 provider
- Server-side and client-side authentication examples
- Route protection using middleware
- OAuth integration with Salesforce (allowing users to connect their Salesforce instance)

The deployed version can be found at [`next-auth-example.vercel.app`](https://next-auth-example.vercel.app)

### About NextAuth.js

NextAuth.js is an easy to implement, full-stack (client/server) open source authentication library originally designed for [Next.js](https://nextjs.org) and [Serverless](https://vercel.com). Our goal is to [support even more frameworks](https://github.com/nextauthjs/next-auth/issues/2294) in the future.

Go to [next-auth.js.org](https://authjs.dev) for more information and documentation.

> _NextAuth.js is not officially associated with Vercel or Next.js._

## Getting Started

### 1. Clone the repository and install dependencies

```
git clone https://github.com/nextauthjs/next-auth-example.git
cd next-auth-example
pnpm install
```

### 2. Configure your local environment

Copy the .env.local.example file in this directory to .env.local (which will be ignored by Git):

```
cp .env.local.example .env.local
```

Add details for one or more providers (e.g. Google, Twitter, GitHub, Email, etc).

#### Database

A database is needed to persist user accounts and to support email sign in. However, you can still use NextAuth.js for authentication without a database by using OAuth for authentication. If you do not specify a database, [JSON Web Tokens](https://jwt.io/introduction) will be enabled by default.

You **can** skip configuring a database and come back to it later if you want.

For more information about setting up a database, please check out the following links:

- Docs: [authjs.dev/reference/core/adapters](https://authjs.dev/reference/core/adapters)

### 3. Configure Authentication Providers

1. Review and update options in `auth.ts` as needed.

2. When setting up OAuth, in the developer admin page for each of your OAuth services, you should configure the callback URL to use a callback path of `{server}/api/auth/callback/{provider}`.

e.g. For Google OAuth you would use: `http://localhost:3000/api/auth/callback/google`

A list of configured providers and their callback URLs is available from the endpoint `api/auth/providers`. You can find more information at https://authjs.dev/getting-started/providers/oauth-tutorial

1. You can also choose to specify an SMTP server for passwordless sign in via email.

### 4. Start the application

To run your site locally, use:

```
pnpm run dev
```

To run it in production mode, use:

```
pnpm run build
pnpm run start
```

### 5. Salesforce OAuth Integration

This application includes a Salesforce OAuth integration that allows users to connect their Salesforce instance. The integration uses the JSForce library for robust Salesforce API interactions.

#### Configuration

1. Create a Connected App in your Salesforce organization:
   - Go to Setup > App Manager > New Connected App
   - Enable OAuth Settings
   - Set the callback URL to `http://localhost:3000/api/auth/callback/salesforce` (for local development)
   - Select the required OAuth scopes (at minimum: `api`, `refresh_token`, `offline_access`)
   - Save the application

2. Add the Salesforce OAuth credentials to your `.env.local` file:

```
SALESFORCE_CLIENT_ID=your_connected_app_consumer_key
SALESFORCE_CLIENT_SECRET=your_connected_app_consumer_secret
```

3. Access the Salesforce integration by navigating to the Salesforce menu item in the application.

#### Features of Salesforce Integration

The Salesforce integration includes the following capabilities:

- OAuth-based authentication with Salesforce
- User profile information retrieval
- SOQL query execution
- CRUD operations for Salesforce objects (create, retrieve, update, delete)
- Batch operations for multiple records
- Analytics API access
- Object metadata access

All Salesforce API interactions are facilitated through the JSForce library, providing a robust and efficient way to communicate with Salesforce.

## Salesforce Integration

This example application includes a fully-functional integration with Salesforce, featuring two authentication methods:

### OAuth-based Authentication
The standard NextAuth.js Salesforce provider is used to authenticate with Salesforce via the OAuth 2.0 flow. This approach:
- Redirects users to Salesforce's login page
- After successful authentication, redirects back with an access token
- Stores the access token securely in the session
- Automatically refreshes tokens as needed

### Direct Authentication
For cases where OAuth isn't suitable (like automated systems or testing), a direct username/password authentication is available:
- Users provide their Salesforce username, password, and security token
- Authentication happens directly via JSForce, Salesforce's JavaScript client library
- Credentials are securely stored in Vercel KV storage (or memory during development)
- A session reference is stored in the browser

### Features
The Salesforce integration includes:
- Dashboard showing user information from the connected Salesforce instance
- Views for contacts, accounts, and opportunities
- CRUD operations via JSForce
- Full TypeScript typings for Salesforce objects
- Secure session management

> Note: Direct authentication method requires storing sensitive credentials. For production use, ensure your Vercel KV storage is properly secured with encryption at rest.

### 6. Stripe Integration

The application includes a subscription system integrated with Stripe:

- Subscription management using Stripe Checkout Sessions
- Webhook handling for subscription events
- User subscription status display
- Secure payment processing

For detailed setup instructions and implementation details, see [Stripe Integration Documentation](./docs/STRIPE_INTEGRATION.md).

### 7. Preparing for Production

Follow the [Deployment documentation](https://authjs.dev/getting-started/deployment)

## Documentation: Generate Query Tool

This project contains an AI-powered Generate Query Tool for producing SELECT-only SOQL from natural language. See:

- `packages/webapp/docs/generate-query-tool.md` — full design, usage, server endpoints, testing notes, and production recommendations.

Quick start (tests):

```bash
pnpm install
pnpm --filter @ennube/webapp test
```

Notes: Unit tests mock heavy ESM dependencies; for integration tests that use the real embedding/vector libraries, run them in an environment prepared for ESM modules.

## Acknowledgements

<a href="https://vercel.com?utm_source=nextauthjs&utm_campaign=oss">
<img width="170px" src="https://raw.githubusercontent.com/nextauthjs/next-auth/main/docs/public/img/etc/powered-by-vercel.svg" alt="Powered By Vercel" />
</a>
<p align="left">Thanks to Vercel sponsoring this project by allowing it to be deployed for free for the entire NextAuth.js Team</p>

## License

ISC


## Adding a task
Help me develop a project plan for this sprint. Create a design and task list document for each to do item. Add the documents to the `packages/webapp/docs/sprint-8-26` directory. 

To Do Tools :