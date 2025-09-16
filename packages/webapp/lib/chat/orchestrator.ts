// === taskManager.ts ===
// Created: 2025-09-13 00:00
// Purpose: Produce a structured task plan (ordered steps + suggested tools) for an agent using AI
// Exports:
//   - taskManagerTool: a tool factory that returns a tool which generates an actionable plan
// Notes:
//   - Uses `generateObject` from the `ai` SDK to produce a validated object response
//   - Mirrors usage pattern from generateQueryTool.ts

import { tool, generateObject, UIMessage, LanguageModel, ModelMessage, stepCountIs, streamText, Tool, UserModelMessage } from "ai";
import z from "zod/v4";
import getModel from "./getModel";
//import { executePlanSequentially, ExecutorOptions, StepProgress } from './planExecutor';

/**
 * Schema describing a single step in the generated plan
 */
export const PlanStepSchema = z.object({
  id: z.string().describe('Unique id for the step'),
  order: z.number().int().nonnegative().describe('Execution order, 0-based or 1-based ordering'),
  // title: z.string().describe('Short title for the step'),
  description: z.string().describe('Detailed description of what to do in this step'),
  tool: z.string().nullable().optional().describe('Name of the tool the agent should use for this step, if any'),
  // toolInput: z.any().nullable().optional().describe('Optional structured input the tool should receive'),
  // mustRunSequentially: z.boolean().optional().describe('Whether this step must run after previous steps'),
  // estimatedMinutes: z.number().int().nullable().optional().describe('Estimated time to complete this step in minutes'),
});

/**
 * Overall plan schema returned by the AI
 */
export const PlanSchema = z.object({
  summary: z.string().describe('Short summary of the agent plan'),
  steps: z.array(PlanStepSchema).nonempty().describe('Ordered list of steps for the agent to execute'),
  confidence: z.number().min(0).max(1).optional().describe('Model confidence score (0-1) if available')
});

export type Plan = z.infer<typeof PlanSchema>;

/**
 * Helper: stringify message history and tools for prompt context without leaking secrets
 */
function buildContext(prompt: ModelMessage, messageHistory?: ModelMessage[], tools?: Record<string, Tool>) {
  const history = (messageHistory || [])
    .map(m => `- ${m.role}: ${JSON.stringify(m.content).substring(0, 100)}`) // truncate long messages
    .join('\n');

  // tools is a Record<string, Tool>; iterate entries to avoid calling .map on an object.
  // Use the object key as the canonical tool name and fall back to a description if available.
  //console.log(tools)
  const toolsList = Object.entries(tools || {})
    .map(([name, t]) => `- ${name}: ${(t as any)?.description || 'No description provided'}`)
    .join('\n');

  const context = `
    User request:
    """
    ${JSON.stringify(prompt.content)}
    """

    Message history:
    ${history || '[none]'}

    Available tools:
    ${toolsList || '[none]'}
  `;
  //console.log(context);
  return context;
}

export async function orchestrator ({ prompt, messageHistory, tools }: { prompt: ModelMessage; messageHistory?: ModelMessage[]; tools?: Record<string, Tool> }) {
      if (!prompt) {
        throw new Error('prompt is required');
      }

      const model = getModel('google/gemini-2.5-flash');
      if (!model) {
        throw new Error('AI model not configured');
      }

      const context = buildContext(prompt, messageHistory, tools);

      const generationPrompt = `
        You are an expert task planner for an autonomous agent. Given a user goal, message history, and a list of available tools, produce a concise, ordered plan the agent should follow to accomplish the goal.

        Rules:
        - Return only the structured object matching the schema provided.
        - Each step should be actionable and mention which tool (from the available list) should be used, if any.
        - Minimize steps but cover necessary validations, data collection, tool calls, and post-processing.
        - If multiple tools can be used, prefer the one explicitly listed in the available tools. Use the tool name exactly.
        - Provide an estimated time in minutes for each step when possible.

        [START OF CONTEXT]
        ${context}
        [END OF CONTEXT]

        Return an object conforming to the schema: { summary, steps: [{ id, order, title, description, tool (optional), toolInput(optional), mustRunSequentially (optional), estimatedMinutes (optional) }], confidence (optional) }
        `;

      console.log('Generating task plan with AI...');

      const { object: planResult } = await generateObject({
        model,
        schema: PlanSchema,
        prompt: generationPrompt,
        // Provider options can be added here if needed
      });

      if (!planResult) {
        throw new Error('AI did not return a plan');
      }

      // Basic validation via Zod (already applied by generateObject, but double-check)
      const parsed = PlanSchema.safeParse(planResult);
      if (!parsed.success) {
        console.error('Plan validation failed', parsed.error.format());
        throw new Error('Generated plan did not match schema');
      }

      // Normalize ordering
      const steps = parsed.data.steps.sort((a, b) => a.order - b.order).map((s, idx) => ({ ...s, order: s.order ?? idx }));
      //console.log('Generated plan:', { summary: parsed.data.summary, steps });
      return {
        summary: parsed.data.summary,
        steps,
        confidence: parsed.data.confidence ?? null,
      } as Plan;
}



/**
 * OVERVIEW
 *
 * - Purpose: Produce an ordered, tool-aware plan for an agent to execute based on a user prompt.
 * - Assumptions: The AI model configured by `getModel` is available and `generateObject` returns a Zod-valid object.
 * - Edge Cases: Missing prompt, empty tool lists, or malformed AI output are handled with errors.
 * - How it fits: This tool can be used by higher-level chat orchestrators to break down user requests into discrete steps and tool calls.
 * - Future Improvements: include example toolInput templates for common tools, support for parallelizable step groups, richer time/priority metadata.
 */

/*
 * === taskManager.ts ===
 * Updated: 2025-09-13 00:00
 * Summary: Exports `taskManagerTool` factory which creates a tool that uses AI to generate a validated plan object
 */
