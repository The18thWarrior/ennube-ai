// === outcomes.ts ===
// Created: 2025-07-22  
// Purpose: Type definitions for agent workflow outcomes and outcome_data
// Exports:
//   - Outcome
//   - OutcomeDataDefault
// Interactions:
//   - Used by: services, controllers, tests, db models
// Notes:
//   - outcome_data is extensible for agent-specific payloads

/**
 * OVERVIEW
 *
 * - Outcome type models the outcomes table in Postgres
 * - outcome_data is a flexible object, default shape provided
 * - Designed for extensibility and type safety
 * - Use OutcomeDataDefault for common agent results
 * - Extend OutcomeDataDefault for agent-specific needs
 */

export interface OutcomeDataDefault {
  /** The goal prompt used for the agent's LLM workflow */
  goal: string;
  /** Array of messages exchanged during the workflow */
  messages: Array<{ role: string; content: string; toolCalls?: Array<unknown>; timestamp?: number }>;
  /** Arbitrary tool data returned by the agent */
  tool_data: Record<string, unknown>;
}

export interface Outcome {
  id: string;
  user_id: string;
  agent: string;
  status: string;
  run_id?: string;
  outcome_data: OutcomeDataDefault | Record<string, unknown>;
  customer_profile_id?: string;
  created_at: number;
  updated_at: number;
}

// === outcomes.ts ===
/**
 * OutcomeLog interface
 * Represents a log entry for actions/events related to an outcome
 */
export interface OutcomeLog {
  /** Unique log entry ID */
  id: string;
  /** Associated outcome ID */
  outcome_id: string;
  /** Timestamp of the log entry (epoch ms) */
  timestamp: number;
  /** Action performed (e.g., 'created', 'updated', 'agent_step') */
  action: string;
  /** Short summary of the log event */
  summary: string;
  /** Array of messages relevant to the log event */
  messages: Array<{ role: string; content: string; toolCalls?: Array<unknown>; timestamp?: number }>;
}
/*
 * Updated: 2025-07-22
 * Summary: Provides type-safe models for agent workflow outcomes
 * Key Components:
 *   - Outcome: Main outcome record
 *   - OutcomeDataDefault: Default shape for outcome_data
 * Dependencies:
 *   - None
 *   - OutcomeLog: Log entry for outcome actions/events
 * Version History:
 *   v1.0 – initial
 * Notes:
 *   - Extend OutcomeDataDefault for agent-specific schemas
 *   v1.1 – added OutcomeLog interface
 */
