# Helios API — Application Definition

Last updated: 2025-08-25

## Purpose

Helios (helios-api) is a backend API that supports SOX-style access review workflows for Salesforce customers. The primary functionality centers around generating User Access Review (UAR) reports from Salesforce data, presenting diffs between historical and current access, routing those reports to managers for approval, tracking approvals and remediation tasks, and exporting or archiving reports. The codebase supports running locally with an Express server for development and is intended to be deployed as AWS Lambda functions for production.

## High-level features

- Generate UAR (User Access Review) reports by querying Salesforce for permissions and object access.
- Create and persist UAR reports and UAR rows in MongoDB via Mongoose models.
- Send email notifications to managers with links to approve or reject items in a report.
- Produce XLSX exports and diff reports (current vs historical) using excel4node.
- Track approvals, approval rows, remediation tasks and audit history.
- Archive reports to S3 and schedule background jobs (cron-like jobs) for report processing.
- Authentication and authorization integrated with AWS Cognito; JWT verification middleware protects routes.

## Architecture overview

- Runtime: Node.js (Express for local dev; AWS Lambda for production)
- Persistence: MongoDB via Mongoose
- External integrations: Salesforce (jsforce), AWS services (S3, Lambda, Cognito, SES), Stripe, SendGrid (partially), email (nodemailer / SES)
- Background jobs / scheduling: `node-cron`-style scheduled functions (loaded by a loader)

The project uses a "loader" pattern at startup (see `src/loaders/index.js`) to initialize the DB connection, Express routes and scheduled jobs. For local development `app.js` starts an Express server which loads the same application stack used by the Lambda entry points in production (the repo is structured to allow running the same service code under both environments).

## Project structure (concise)

Top-level files
- `app.js` - Development entry point that spins up an Express server and loads the application via `src/loaders`.
- `package.json` - NPM metadata and scripts.
- `nodemon.json` - Development watcher config.
- `README.md` - Quick start notes.

Key directories under `src/`
- `src/api/` - Express routing registration. `src/api/index.js` wires route modules mounted under the API prefix (config.api.prefix, default `/api`).
  - `src/api/routes/*.route.js` - Files that attach endpoints to the router for each domain (account, uar_report, uar_row, approval, etc.).
- `src/controllers/` - Controllers that handle HTTP requests, orchestrate services, and return responses. Controllers are thin orchestration layers (e.g. `uar_report.controller.js`).
- `src/services/` - Business logic and integration with external APIs and persistence. Services perform CRUD with the Mongoose models, call Salesforce, send emails, work with S3, and build XLSX/diff exports (e.g. `uar_report.service.js`, `uar_row.service.js`, `salesforce.service.js`).
- `src/models/` - Mongoose model definitions and schemas for domain objects (UAR Reports, UAR Rows, Approvals, Projects, Organizations, etc.).
- `src/loaders/` - Initialization modules run on startup. Includes `express.js`, `mongoose.js`, `scheduled_functions.js`, and `index.js` which wires them together.
- `src/middleware/` - Express middleware such as `authCheck.js` for JWT/Cognito validation.
- `src/config/` - Central configuration built from environment variables and constants (e.g. Salesforce queries, email templates, MongoDB URL, server hostname/port, Excel styles).
- `src/utilities/` - Utility helpers like CSV builders, a logging helper, and token extraction.
- `src/controllers`, `src/services`, `src/models` form the typical controller-service-model separation.

Other notable folders
- `libs/` - Lightweight helper clients for AWS SDK usage (S3, Lambda clients) used by services.
- `docs/` - Project documentation (this file).

## API surface (overview)

Routes are mounted at the configured API prefix (config.api.prefix, default `/api`). The main route modules (found at `src/api/routes`) include:

- `account` - account management endpoints
- `approval`, `approval_row` - approval lifecycle and row-level approval operations
- `auditor`, `audit_history` - audit and auditor related endpoints
- `manager_data` - upload/management of manager mappings and CSV ingestion
- `organization`, `project` - organizational and project settings
- `remediation_task` - remediation task endpoints
- `salesforce` - endpoints used to connect or proxy Salesforce-related operations
- `stripe` - payment / billing related endpoints
- `uar_report` - endpoints for creating, generating, exporting, sending and querying UAR reports
- `uar_row` - UAR row level operations

Controller functions in `src/controllers/uar_report.controller.js` illustrate typical interactions: a controller will validate/extract request parameters, call service methods (for example `uar_report.service.createUARReport`, `uar_row.service.generateUARRows`, `salesforce.service.*`) and return JSON or binary responses (XLSX buffers for exports).

Example high-level UAR flow
1. Client requests generation of a UAR report (POST /api/uar-report/generate).
2. Controller verifies auth and account info, then calls Salesforce through `salesforce.service` to retrieve permission sets, profiles, and user assignments.
3. Service logic maps key settings and objects, creates a UARReport document (MongoDB), generates UAR rows, persists rows, and returns a payload including queries used.
4. Client may then trigger `sendEmailNotification` which updates managers with access and uses SES/email service to send approval emails.
5. Managers visit the provided frontend link to approve/reject items, which updates `approval`/`approval_row` documents and may create remediation tasks.

## Data models (summary & example)

Mongoose models live in `src/models`. Not all schemas are documented here; the below is an inferred example shape for `UARReport` based on service and controller usage in the repository. (Assumption: exact field types and indexes are implemented in model files.)

Example UARReport (inferred)
{
  _id: "ObjectId",
  accId: "String",
  orgId: "String",
  projId: "String",
  name: "String",
  status: "Ready to Send|Pending Approvals|Approval Review|Completed",
  keySystemSettings: { /* map of system settings selected for the report */ },
  keyObjects: ["Account","Contact"],
  dueDate: "ISODate",
  managersWithAccess: ["manager@example.com"],
  createdAt: "ISODate",
  updatedAt: "ISODate",
  lastViewed: "ISODate"
}

Related domain objects (high-level):
- UARRow - individual row derived from Salesforce and user permissions (reportType = 'System Setting' or 'Object Access')
- ApprovalRow - grouping of approvals for a manager over a subset of rows
- Approval - single approval decision (Approved/Rejected) per user/row
- RemediationTask - tasks generated for remediation after approvals result in required actions

Note: For exact schema definitions refer to files under `src/models` (e.g. `src/models/uar_report.model.js`, `uar_row.model.js`, `approval.model.js`).

## Configuration & environment variables

Configuration is centralized in `src/config/index.js` and reads many values from environment variables via dotenv. Important variables you will typically need to provide (from inspecting `src/config/index.js`):

- MONGODB_USERNAME, MONGODB_PASSWORD, MONGODB_URL - MongoDB connection credentials
- AWS_ACCESS_KEY, AWS_SECRET_ACCESS_KEY, AWS_REGION - AWS SDK credentials (used for S3, Lambda, SES, Cognito etc.)
- COGNITO_CLIENTID, COGNITO_URL, COGNITO_USERPOOLID - Cognito values for authentication
- SFDC_CLIENT_ID, SFDC_CLIENT_SECRET, SFDC_LOGIN_URL - Salesforce OAuth and connection settings
- SES_FROM_ADDRESS - From address for SES email sends
- STRIPE_API_KEY, STRIPE_PRICE_ID - Stripe configuration
- ARCHIVED_PROJECT_BUCKET - S3 bucket used for archived reports
- NODE_ENV - 'development' or 'production', used to toggle frontend domain and some behavior

When running locally, create a `.env` in repo root (see README) and populate required values. The repo expects a `.env` pulled from a 
central secrets manager in production (the team uses AWS Secrets Manager in `us-west-1` for env variables according to README notes).

## Deployment & runtime

Production is expected to run as AWS Lambda functions. The codebase contains small helper libraries in `libs/` for AWS SDK clients (`lambdaClient.js`, `s3Client.js`) and the project uses environment variables and IAM credentials to access AWS services (S3, SES, Lambda, Cognito). GitHub Actions are used by the team for deploying the Lambda in production (note: CI/CD workflow files are not included in this repository snapshot).

For local development:

- Install dependencies: npm install
- Add a `.env` file in repo root with the env vars the app expects (see `src/config/index.js`).
- Start the local Express server: npm run dev (or npm start)
- Server listens on the port configured in `src/config/index.js` (default 3001).

When running locally you may see a TODO regarding "Fix load issue when NODE_ENV=production" in `app.js` — keep NODE_ENV=development for local Express runs.

## Troubleshooting and common issues

- MongoDB connection errors: confirm `MONGODB_USERNAME`, `MONGODB_PASSWORD`, and `MONGODB_URL` are correct. The `mongoose` loader constructs a connection string of the form `mongodb+srv://<username>:<password>@<url>`.
- Authentication errors: Cognito token verification is performed in `src/middleware/authCheck.js` via `services/cognito.service.js`. Ensure the Cognito env variables and public keys (if used) are correctly configured.
- AWS SDK permission errors: AWS credentials and region must be available to the process (env vars or instance profile). Check that the IAM role/user has S3 and SES permissions if using those integrations.
- XLSX generation issues: `excel4node` is used to generate workbooks in memory and write buffers for download — memory usage can spike for very large reports; watch for Node.js heap OOM on large exports.

## Where to look for implementation details

- Route definitions: `src/api/routes/*.route.js`
- Controller logic: `src/controllers/*.js` (use `uar_report.controller.js` as a complex example)
- Business logic & integrations: `src/services/*.js` (heaviest logic is in `uar_report.service.js`, `uar_row.service.js`, `salesforce.service.js`)
- Data models: `src/models/*.js` (UAR-related models include `src/models/uar_report.model.js` and `src/models/uar_row.model.js`)
- Startup and initialization: `src/loaders/index.js`, `src/loaders/express.js`, `src/loaders/mongoose.js`

## Small notes & assumptions made while creating this document

- Some behavior is inferred from service/controller usage rather than explicitly documented; where I inferred shapes/types I marked them as "inferred". For exact field definitions, consult the model files in `src/models`.
- Deployment specifics (GitHub Actions, exact Lambda handlers) were not present in the scanned files; the README mentions deployment via GitHub Actions and Lambda but CI/CD pipeline files were not available in this workspace slice.

## Next steps (suggested)

- Add an architecture diagram (drawn or plantuml) into `docs/` to visualize the flow between frontend, API (Lambda/Express), MongoDB, Salesforce, and S3/SES.
- Add an env.example file listing required variables with descriptions to make local setup easier.
- Add a health-check / readiness endpoint documentation for Kubernetes or load balancers if Lambda is swapped for containerized deployments.

---

If you'd like, I can: generate `docs/env.example.md` listing required environment variables, add a simple sequence diagram in PlantUML, or update the README with local dev steps. Tell me which you'd prefer and I'll continue.

## Architecture diagram (PlantUML)

I added a PlantUML file containing both a component-style architecture diagram and a sequence diagram for the UAR report generation flow:

- `docs/architecture.puml` — PlantUML source (component + sequence diagrams). Render it with PlantUML to produce PNG/SVG.

To render locally (if you have PlantUML installed):

```bash
# render PNG
plantuml docs/architecture.puml

# or render to SVG
plantuml -tsvg docs/architecture.puml
```

If you prefer, I can also render and commit a PNG or SVG into `docs/` for convenience (I didn't render a binary here to keep the repo text-only). Let me know and I will add the generated image file as well.