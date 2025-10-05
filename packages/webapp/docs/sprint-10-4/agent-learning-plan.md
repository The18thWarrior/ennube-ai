# Agent Learning Integration Plan (Sprint 10/4)

## Overview
- **Goal**: Introduce user-specific continual learning for agents by adapting the Memento framework while preserving existing Next.js/AI SDK orchestration.
- **Scope**: Extend chat orchestration and task planning (`lib/chat/orchestrator.ts`, `lib/chat/chatAgent.ts`, `app/api/chat/route.ts`) to read/write a persistent memory layer backed by PostgreSQL.
- **Outcomes**:
  - Durable storage for per-user interaction trails and distilled learnings.
  - Retrieval hook that biases planning/execution via stored memories.
  - Operational tooling to monitor, test, and iterate on learning quality.
  - Cost-optimized storage by reusing the existing PostgreSQL footprint with `pgvector`, avoiding new infrastructure.

## Key Concepts Borrowed from Memento
| Memento Concept | Description | Mapping in ennube-ai |
| --- | --- | --- |
| Planner–Executor loop | Two-stage loop (planner creates steps, executor runs them) | `orchestrator` already generates plans; `chatAgent` executes via `streamText` |
| Case Memory / Case Bank | Storage of (state, action, reward) tuples for reuse | New Postgres tables storing structured `memory_cases` linked to user + agent |
| Case-Based Retrieval | Retrieve top-K relevant past cases to steer decisions | New memory retrieval service invoked before `streamText` tool execution |
| Memory Write-Back | Persist successful or failed outcomes with metadata | Post-response hook in `chatAgent` to record outcomes + reward signal |
| Evaluation Feedback | Reward shaping based on success criteria | Initial heuristic from user confirmation + tool result status; future human eval UI |

## Memento Paper Insights and Design Implications
- **Memory-Augmented MDP**: The paper frames agent behaviour as a Memory-Based Markov Decision Process (M-MDP) where each case is a tuple $(s, a, r)$ stored in a case bank that augments the state during planning. For our integration, we will treat each final tool-executed step (plan + outcome) as the canonical case to persist, ensuring we mirror the paper’s trajectory consolidation strategy.
- **Retrieve → Reuse → Evaluate → Retain Loop**: Memento formalises the agent loop as retrieval (select cases via policy $\mu$), reuse/revise via LLM planner, evaluate via reward, and retain by appending the new case. Our orchestration should explicitly surface these four stages in logging and telemetry so we can audit the learning loop.
- **Dual Memory Modes**:
  - *Non-Parametric Retrieval*: Retrieve Top-$K$ (paper finds $K=4$ optimal) cases ranked by semantic similarity. We will default to $K=4$ while allowing dynamic tuning per agent profile.
  - *Parametric Retrieval*: Train a lightweight Q-function over $(s, c)$ pairs using a binary cross-entropy loss (Eq. 15 in paper) to prioritise high-utility cases. We will store model checkpoints/weights in Postgres (or object storage) and expose an API for online updates when reward signals arrive.
- **Case Memory, Subtask Memory, Tool Memory**: Beyond the case bank, Memento keeps dedicated memories for subtasks and tool traces. Our existing `tool_traces` JSONB column and plan summaries align with this; we will extend schemas to segment data per stage to support granular retrospection.
- **Reward Signals**: Paper leverages binary rewards derived from task success (GAIA/DeepResearcher). We will use multi-source heuristics (tool success, user feedback, downstream business metrics) to compute a bounded score in `reward_score`, enabling future conversion to binary labels for parametric training.
- **Performance Benchmarks**: Gains of +4.7–9.6 PM on OOD datasets underscore the need for curated, high-quality memories. We must enforce pruning and quality filters (e.g., drop low-reward cases, prefer diverse contexts) to avoid swamping the retriever.
- **Operational Considerations**: The paper highlights rising token costs with longer tasks. Our design should cap injected memory context size (e.g., token budget per retrieved case) and include telemetry around incremental token usage when memory context is added.

## Cost-Effectiveness Strategy (Feedback Integration)
- **Single Data Store**: Keep structured case data and vector embeddings inside the existing PostgreSQL instance with `pgvector`. This keeps operational overhead low, eliminates synchronisation code, and removes the need for an additional paid vector service.
- **Serverless Postgres Hosting**: Prefer managed serverless options (Neon, Supabase) that provide `pgvector` out-of-the-box and scale compute to zero, matching the variable workload profile for agent learning.
- **Data Footprint Discipline**: Enforce pruning windows (`window_size`) and reward-weighted retention so that per-user memory stays compact. Compress large JSON payloads before persisting where practical to minimise storage costs.
- **Efficient Retrieval**: Restrict similarity search to per-user partitions, combine filters with vector search, and use optimised HNSW indexing parameters to keep query compute usage modest. Retrieval latency remains dominated by LLM inference, so cost and performance remain favourable.

## Assumptions
- PostgreSQL (with `pgvector`) remains the primary persistence layer; we reuse the existing connection pool in `lib/db` and extend the schema.
- The database is hosted on a serverless Postgres provider (e.g., Neon, Supabase) that can scale to zero during idle periods while exposing `pgvector`.
- If `pgvector` is temporarily unavailable, fall back to cosine similarity computed in app layer; capture in risks and telemetry.
- AI workloads continue via OpenRouter/Gemini (planner) and existing tool stack.
- Learning data is private per Auth0 `userSub`; cross-user sharing is out of scope for Sprint 10/4.

## High-Level Architecture
```
User Message → app/api/chat/route.ts → chatAgent → orchestrator → streamText/tools
   │                                               │                 │
   │                                       Memory Retrieval ─────────┘
   │                                               │
   └──► Learning Pipeline (post-response hook) → PostgreSQL (memory tables)
                                    │
                           Analytics / Telemetry
```

### Flow Description
1. **Request Intake** (`route.ts`): authenticate user, derive `userSub`, invoke agent flow.
2. **Planning** (`orchestrator.ts`): optionally augment prompts with retrieved memories.
3. **Execution** (`chatAgent.ts`): run tools; capture intermediate outcomes/logs.
4. **Write Back**: after each tool call or final response, persist distilled memory rows.
5. **Retrieval for Next Run**: before planning, fetch top-K memories for this user + agent context.

## Data Model (PostgreSQL)
Proposed new tables (use a migration / schema management strategy consistent with current SQL scripts under `packages/webapp/sql/`).

### `agent_memory_profiles`
Stores per-user configuration and statistics.
| Column | Type | Notes |
| --- | --- | --- |
| `id` | UUID PK | `DEFAULT gen_random_uuid()` |
| `user_sub` | TEXT | Auth0 subject, FK to `credential`/`usage_log` tables |
| `agent_key` | TEXT | e.g. `data-steward`, `prospect-finder` |
| `window_size` | INT | Sliding window of cases to retain (per agent) |
| `created_at` | TIMESTAMPTZ | default `NOW()` |
| `updated_at` | TIMESTAMPTZ | auto updated |

### `agent_memory_cases`
Core memory bank capturing outcomes.
| Column | Type | Notes |
| --- | --- | --- |
| `id` | UUID PK |
| `profile_id` | UUID FK → `agent_memory_profiles.id` |
| `message_hash` | TEXT | Hash of triggering user message (dedupe) |
| `prompt_snapshot` | JSONB | Normalized prompt/context fed to LLM |
| `plan_summary` | JSONB | Ordered steps + tools used |
| `tool_traces` | JSONB | Reduced logs (inputs, outputs, status, duration); consider compression before storage to cut costs |
| `outcome` | TEXT | `success`, `failure`, `partial`, `aborted` |
| `reward_score` | NUMERIC | Scalar heuristic (0-1) |
| `tags` | TEXT[] | domains, topics |
| `created_at` | TIMESTAMPTZ | default `NOW()` |
| `reference_case_ids` | UUID[] | Case IDs retrieved during planning (supports audit & training) |

### `agent_memory_embeddings`
Optional vector storage for semantic retrieval (if `pgvector` available).
| Column | Type | Notes |
| --- | --- | --- |
| `case_id` | UUID PK/FK → `agent_memory_cases.id` |
| `embedding` | VECTOR(1536) | size depends on embedding model |
| `metadata` | JSONB | Additional scoring info |
| `created_at` | TIMESTAMPTZ |

### `agent_memory_audit`
Tracks mutations for observability.
| Column | Type | Notes |
| --- | --- | --- |
| `id` | BIGSERIAL PK |
| `user_sub` | TEXT |
| `agent_key` | TEXT |
| `action` | TEXT | `insert_case`, `update_case`, `prune_case` |
| `payload` | JSONB |
| `created_at` | TIMESTAMPTZ |

**Indexes**: Composite (`user_sub`, `agent_key`, `created_at DESC`), composite (`profile_id`, `created_at DESC`) to pre-filter per user, vector index on `embedding` (HNSW with tuned `m`/`ef_construction`), and GIN on `tags`.

### `agent_memory_policies`
Stores parametric retrieval metadata (soft Q-learning heads).
| Column | Type | Notes |
| --- | --- | --- |
| `id` | UUID PK |
| `profile_id` | UUID FK → `agent_memory_profiles.id` |
| `version` | INT | Incremented on each training update |
| `weights` | JSONB | Serialized parameters (e.g., MLP weights, kernel coefficients) |
| `loss_metrics` | JSONB | Training diagnostics (loss, accuracy, timestamp) |
| `trained_at` | TIMESTAMPTZ | Last update time |
| `status` | TEXT | `active`, `training`, `failed` |

## Component Changes
### `app/api/chat/route.ts`
- Derive `userSub` (already present) and pass to downstream orchestrator/agent in metadata.
- Gate feature via query parameter or feature flag stored in `agent_memory_profiles`.
- Ensure `storeFilesFromMessages` covers persistence of learning artifacts (documents) for linking memory rows.

### `lib/chat/orchestrator.ts`
- Prior to `generateObject`, retrieve both non-parametric (similarity) and parametric (policy-weighted) candidate cases, then merge the Top-$K$ (`K=4` default) with diversity heuristics to avoid redundant memories.
- Inject `memory_context` composed of **Context / Actions / Outcome / Reward** snippets per case (paper template) and keep within a configurable token budget.
- Extend `PlanStepSchema` to accept optional `referenceCaseIds` and propagate them into downstream telemetry and the new `reference_case_ids` column.
- Log retrieval metrics (hit-rate, latency, policy version) so we can monitor the quality of the retrieval policy and align with Memento’s retrieve→reuse audit trail.

### `lib/chat/chatAgent.ts`
- After plan generation and after each tool step, call `memoryWriter.enqueue({ userSub, agentKey, plan, toolResult })`.
- Inject retrieved memories into `_messages` as a system or assistant message to bias reasoning (e.g., “Relevant prior successes…”).
- Capture rewards: immediate heuristic (tool success), plus request user thumbs-up/ thumbs-down to update `reward_score` asynchronously.

### New Supporting Modules
- `lib/memory/memory-service.ts`: CRUD wrapper using `pg` pool; handles vector embedding via existing embedding provider (likely `ai` SDK embed endpoints) and manages transactional writes across cases, embeddings, policies, and audits.
- `lib/memory/memory-retriever.ts`: fetch Top-$K$ cases by combining cosine similarity and policy scores (softmax over Q-values); implement fallback keyword search using `ILIKE` if vectors unavailable.
- `lib/memory/memory-policy.ts`: light training loop for parametric retrieval (soft Q-learning / binary CE) with support for background training jobs and weight versioning.
- `lib/memory/memory-writer.ts`: queue writes (in-memory buffer + background flush via `setImmediate`) to avoid blocking response; compute reward heuristics and populate `reference_case_ids`.
- `lib/memory/types.ts`: shared interfaces.
- Optional: `lib/memory/audit.ts` for structured logging to `agent_memory_audit`.

## Implementation Plan
### Phase 0 – Foundations (1 day)
- Confirm `pgvector` availability on the chosen serverless Postgres provider; update infrastructure script if needed.
- Add SQL migration files for new tables under `packages/webapp/sql/` with backward-compatible scripts.
- Define feature flag strategy (ENV flag or `agent_memory_profiles` activation column).
- Evaluate compression approach for large JSONB payloads (e.g., `pako` -> `BYTEA`) and document trade-offs.

### Phase 1 – Data Layer & Services (2-3 days)
- Implement memory service modules with comprehensive TS types and Zod validation.
- Wire unit tests mocking `pg` to cover CRUD, pruning, reward normalization, and failure cases.
- Integrate embedding provider (possibly OpenAI `text-embedding-3-small`) with retry/backoff; abstract to allow swap.
- Scaffold parametric policy persistence (`agent_memory_policies`) and stub training job interface.
- Implement optional compression/decompression utilities for `prompt_snapshot` and `tool_traces` with benchmarks to ensure CPU overhead is acceptable.

### Phase 2 – Retrieval Hook (2 days)
- Modify `orchestrator` to fetch Top-$K$ cases (default 4) before plan generation and combine non-parametric + parametric scores.
- Inject `memory_context` into system prompt (limit tokens via summarization; reuse Memento’s **Context / Actions / Reward** framing).
- Introduce telemetry for retrieval hit-rate, latency, policy version, and token overhead.
- Validate HNSW index performance under per-user filtering; tune `ef_search` at runtime for accuracy vs. cost.

### Phase 3 – Write-Back & Reward Loop (3 days)
- Instrument `chatAgent` to capture plan, tool results, final assistant response.
- Create `MemoryWriter` to persist cases, embeddings, and parametric policy training examples asynchronously.
- Add heuristics for `reward_score`: success = 1, failure = 0, partial = 0.5, optionally adjusted via user feedback from UI (future sprint); retain binary reward flag for compatibility with Memento’s CE loss.
- Implement pruning policy (e.g., keep latest N=200 cases per user/agent, or age-based TTL) and diversity filters to prevent swamping as noted in the paper.

### Phase 4 – Quality & Ops (2 days)
- Build admin view (or log analytics script) to inspect stored memories per user.
- Observability: integrate with existing logging (e.g., `console` -> `pino` upgrade) and add metrics to DataDog/New Relic if available.
- Finalize documentation, usage playbook, and rollout checklist.

## Testing Strategy
- **Unit Tests**: `lib/memory` modules (CRUD, retrieval ranking, embedding fallback, error handling).
- **Integration Tests**: Mock `chatAgent` pipeline to ensure memories are retrieved/injected and persisted (use Jest + `pg` test container or `pg-mem`), validating both non-parametric and policy-guided retrieval paths.
- **Load Testing**: Validate write throughput under concurrent chats; ensure PostgreSQL pool sizing is sufficient.
- **Red Teaming**: Validate that adversarial inputs don’t poison memories (e.g., add sanitization + risk filters).
- **Simulation Tests**: Offline replay of historical conversations with synthetic rewards to benchmark retrieval accuracy and confirm $K=4$ default delivers optimal utility.
- **Cost Regression Tests**: Track storage growth, index size, and query latency over synthetic workloads to confirm pruning + compression keep costs within budget.

## Security & Compliance
- Encrypt sensitive columns at rest if storing tool outputs containing PII.
- Ensure `userSub` is the partition key; enforce row-level security if using hosted Postgres (Supabase/Neon).
- Add sanitization pipeline to strip secrets/token-like strings before persistence.
- Align retention with privacy policy; add CLI to purge user memories on request (GDPR/CCPA compliance).
- Protect against memory poisoning by rate limiting writes per user/session and introducing anomaly detection that downweights low-reward, high-frequency cases (paper cautions against retrieval swamping).
- Review compression strategy for compliance (ensure no proprietary algorithm risk) and document decompression safeguards to prevent malicious payload injection.

## Deployment & Rollout
- **Feature Flag**: Start with internal accounts; gradually enable per agent.
- **Migrations**: Execute SQL scripts with downtime-safe pattern (`CREATE TABLE IF NOT EXISTS`).
- **Backfill**: Optional script to retroactively ingest recent chat logs (if available) to seed memories.
- **Monitoring**: Alerts on memory write failures, embedding latency, table growth.

## Open Questions & Risks
1. Do we have access to embeddings without impacting cost budgets? If not, explore free/cheap options (e.g., `text-embedding-3-small`).
2. Should memory items be sharable across agents when domain overlaps? Default: no (future enhancement).
3. How to surface learning to users? Provide UI in future sprint to display/edit memories.
4. What heuristics best approximate reward? Consider hooking into Salesforce/Stripe outcomes for objective success signals.
5. Need for rate limiting to prevent malicious users from spamming memory writes.
6. Where should the parametric policy training jobs run (Next.js API route, background worker, external service)?
7. If pgvector is unavailable, do we degrade gracefully to cosine similarity in app layer without unacceptable latency?
8. Compression approach: do we store compressed `tool_traces`/`prompt_snapshot` as `BYTEA`, or keep JSONB with size limits?
9. Serverless Postgres limits: confirm cold-start latency and connection caps for Neon/Supabase under projected load.

## Next Steps
- Review data model with infra team; confirm migration timeline.
- Align with product on success metrics and opt-in UX.
- Once approved, open implementation tickets per phase (estimates above) and begin with Phase 0 foundations.
- Partner with data science to define reward labeling pipeline and policy training cadence aligned with paper’s soft Q-learning approach.
- Coordinate with platform team to provision/deploy serverless Postgres (Neon/Supabase) with `pgvector`, HNSW indexing support, and cost monitoring dashboards.
