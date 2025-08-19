// === initiator.ts ===
// Created: 2025-08-18 12:20
// Purpose: Simple initiator agent to refine user goal

export async function runInitiator(messages: any[]) {
  // Simple implementation: extract last user message as goal and add a concise strategy
  const last = messages && messages.length ? messages[messages.length - 1] : null;
  const goal = last?.content || 'No goal provided';
  const strategy = `Refine goal and instruct agents to work in parallel on: ${goal}`;
  const successCriteria = ['Produce actionable items', 'Return data references when used'];
  return { goal, strategy, successCriteria };
}
