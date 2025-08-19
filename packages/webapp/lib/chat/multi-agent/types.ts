// === types.ts ===
// Created: 2025-08-18 12:00
// Purpose: TypeScript types, enums and Zod schemas for Multi-Agent system

import { z } from 'zod';

export enum MultiAgentEventType {
  ConversationStart = 'conversation_start',
  InitiatorStart = 'initiator_start',
  InitiatorComplete = 'initiator_complete',
  RoundStart = 'round_start',
  AgentStart = 'agent_start',
  AgentToolCall = 'agent_tool_call',
  AgentToolResult = 'agent_tool_result',
  AgentResponseChunk = 'agent_response_chunk',
  AgentComplete = 'agent_complete',
  RoundComplete = 'round_complete',
  SummarizerStart = 'summarizer_start',
  SummarizerChunk = 'summarizer_chunk',
  ConversationComplete = 'conversation_complete',
  Error = 'error',
  AgentError = 'agent_error'
}

export type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
};

export type ToolCall = {
  id: string;
  name: string;
  args?: Record<string, any>;
  result?: any;
  status?: 'call' | 'result' | 'failed';
};

export type AgentResult = {
  agent: string;
  response: string;
  toolCalls: ToolCall[];
  steps: number;
  finishReason?: string;
};

export type RoundResult = {
  roundNumber: number;
  agentResults: AgentResult[];
  timestamp: string;
};

export type MultiAgentRequest = {
  agents: string[];
  rounds: number;
  messages: ChatMessage[];
};

export const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  timestamp: z.string().optional(),
});

export const MultiAgentRequestSchema = z.object({
  agents: z.array(z.string()).min(1).max(5),
  rounds: z.number().min(1).max(10),
  messages: z.array(ChatMessageSchema).min(1),
});

/*
 * === types.ts ===
 * Updated: 2025-08-18 12:00
 * Summary: Types and schemas for multi-agent orchestrator and streaming
 */
