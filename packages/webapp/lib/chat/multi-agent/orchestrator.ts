// === orchestrator.ts ===
// Created: 2025-08-18 12:10
// Purpose: Core orchestrator for multi-agent conversations. Emits events via async generator.

import { MultiAgentRequest, MultiAgentEventType, RoundResult, AgentResult, ToolCall } from './types';

export class MultiAgentOrchestrator {
  userSub: string;
  agents: string[];
  rounds: number;

  constructor(userSub: string, agents: string[], rounds: number) {
    this.userSub = userSub;
    this.agents = agents;
    this.rounds = rounds;
  }

  async *executeConversation(messages: any[]): AsyncGenerator<any, void, unknown> {
    const sessionId = `ma_${Date.now()}`;
    yield { type: MultiAgentEventType.ConversationStart, data: { sessionId, agents: this.agents, rounds: this.rounds, timestamp: new Date().toISOString() } };

    // Initiator phase - simple one that echoes goal
    yield { type: MultiAgentEventType.InitiatorStart, data: { agent: 'initiator', timestamp: new Date().toISOString() } };
    const refinedGoal = (messages && messages.length > 0) ? `${messages[messages.length-1].content}` : 'No goal provided';
    yield { type: MultiAgentEventType.InitiatorComplete, data: { goal: refinedGoal, strategy: 'parallel agents', successCriteria: [], timestamp: new Date().toISOString() } };

    // Multi-round collaboration
    const context: { history: RoundResult[] } = { history: [] };

    for (let round = 1; round <= this.rounds; round++) {
      yield { type: MultiAgentEventType.RoundStart, data: { round, agents: this.agents, goal: refinedGoal, timestamp: new Date().toISOString() } };

  // Sequential per-agent simulation (we avoid yielding from inside nested async callbacks)

      const agentResults: AgentResult[] = [];
      for (const agent of this.agents) {
        // simple per-agent simulation to ensure ordered streaming
        // replicate what's above but synchronously
        const toolCall = { id: `tool_${agent}_${round}`, name: 'getData', args: { q: 'simulated' }, status: 'result', result: { records: [{ id: 'r1', name: 'Sample' }] } } as ToolCall;
        yield { type: MultiAgentEventType.AgentStart, data: { agent, round, maxSteps: 4, timestamp: new Date().toISOString() } };
        yield { type: MultiAgentEventType.AgentToolCall, data: { agent, round, step: 1, toolCall, timestamp: new Date().toISOString() } };
        yield { type: MultiAgentEventType.AgentToolResult, data: { agent, round, step: 1, toolCallId: toolCall.id, result: toolCall.result, timestamp: new Date().toISOString() } };
        const response = `Agent ${agent} round ${round} processed ${toolCall.result.records.length} records.`;
        yield { type: MultiAgentEventType.AgentResponseChunk, data: { agent, round, chunk: response, timestamp: new Date().toISOString() } };
        const agentResult: AgentResult = { agent, response, toolCalls: [toolCall], steps: 3, finishReason: 'completed' };
        yield { type: MultiAgentEventType.AgentComplete, data: { ...agentResult, round, timestamp: new Date().toISOString() } };
        agentResults.push(agentResult);
      }

      const roundResult: RoundResult = { roundNumber: round, agentResults, timestamp: new Date().toISOString() };
      context.history.push(roundResult);
      yield { type: MultiAgentEventType.RoundComplete, data: { ...roundResult } };
    }

    // Summarizer
    yield { type: MultiAgentEventType.SummarizerStart, data: { timestamp: new Date().toISOString() } };
    const summary = `Summarized ${context.history.length} rounds for agents ${this.agents.join(', ')}`;
    yield { type: MultiAgentEventType.SummarizerChunk, data: { chunk: summary, timestamp: new Date().toISOString() } };

    yield { type: MultiAgentEventType.ConversationComplete, data: { summary, totalRounds: this.rounds, totalAgents: this.agents.length, executionTime: 1, timestamp: new Date().toISOString() } };
  }
}
