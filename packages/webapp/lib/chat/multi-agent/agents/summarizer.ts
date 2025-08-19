// === summarizer.ts ===
// Created: 2025-08-18 12:21
// Purpose: Simple summarizer agent to synthesize round results

export async function runSummarizer(context: { history: any[] }) {
  // Minimal summarization: join agent responses
  const summaries = context.history.map(r => r.agentResults.map((ar: any) => `${ar.agent}: ${ar.response}`).join('\n')).join('\n---\n');
  const final = `Summary of ${context.history.length} rounds:\n${summaries}`;
  return { summary: final };
}
