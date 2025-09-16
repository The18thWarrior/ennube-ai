// // === planExecutor.ts ===
// // Created: 2025-09-13 00:00
// // Purpose: Execute a Plan (from taskManager) sequentially against a set of tools.
// // Exports:
// //  - executePlanSequentially: runs steps in order, supports per-step timeout, retries, and progress callbacks
// // Notes:
// //  - Uses a small adapter to call tools that may be functions or objects with `run`/`call`/`execute` methods
// //  - Does not perform any I/O besides calling the provided tool implementations

// import type { Plan } from './orchestrator';
// import type { Tool, LanguageModel } from 'ai';
// import { streamText } from 'ai';
// import getModel from './getModel';

// export type StepProgress = {
//   stepId: string;
//   order: number;
//   title: string;
//   status: 'started' | 'success' | 'failed';
//   output?: any;
//   error?: any;
//   elapsedMs?: number;
// };

// export type ExecutorOptions = {
//   timeoutMs?: number; // per-step timeout (default 60000)
//   retries?: number; // number of automatic retries AFTER the first attempt (default 1 -> one retry)
//   abortOnFailure?: boolean; // whether to abort the whole plan when a step fails (default true)
//   onProgress?: (ev: StepProgress) => void | Promise<void>;
//   onChunk?: (ev: { stepId: string; order: number; chunk: string }) => void | Promise<void>;
//   model?: LanguageModel; // optional model override for per-step LLM calls
// };

// function defaultTimeoutPromise(ms: number) {
//   return new Promise((_, rej) => setTimeout(() => rej(new Error('step timeout')), ms));
// }

// /**
//  * Adapter: call a tool which may be provided as several shapes.
//  * - a function (input) => Promise
//  * - an object with .run(input) or .call(input) or .execute(input)
//  * If none of these shapes match, throws.
//  */
// // No local tool adapter: tools will be provided to the LLM via generateText so the model can invoke them.

// export async function executePlanSequentially(plan: Plan, tools: Record<string, Tool>, options?: ExecutorOptions) {
//   const timeoutMs = options?.timeoutMs ?? 60_000;
//   const retries = options?.retries ?? 1; // number of retries after first attempt
//   const abortOnFailure = options?.abortOnFailure ?? true;
//   const onProgress = options?.onProgress;
//   const model = options?.model ?? getModel();
//   if (!model) throw new Error('LLM model not configured for plan execution');

//   const results: Array<{ stepId: string; order: number; success: boolean; output?: any; error?: any; elapsedMs?: number }> = [];

//   // Ensure steps are ordered
//   const steps = [...plan.steps].sort((a, b) => a.order - b.order);

//   // Threaded context: start with empty context or optional plan-level input
//   let threadedInput: any = {};

//   for (const step of steps) {
//     const start = Date.now();
//     await Promise.resolve(onProgress?.({ stepId: step.id, order: step.order, title: step.title, status: 'started' }));

//     // Build the per-step input: combine threadedInput, step.toolInput and description
//     const stepInput = {
//       ...(threadedInput || {}),
//       ...(step.toolInput || {}),
//       __stepDescription: step.description,
//       __stepTitle: step.title,
//     };

//     // If no tool specified, call the model directly for this step
//     let output: any = null;
//     let lastError: any = null;
//     let success = false;
//     const maxAttempts = 1 + retries;

//     // Prepare tools metadata to include in the model prompt
//     //const availableTools = (step.tool ? [{ name: step.tool, description: 'Provided tool for this step' }] : []);

//     for (let attempt = 1; attempt <= maxAttempts && !success; attempt++) {
//       try {
//         // For each step, we provide the model with only the tools relevant to this step
//         const stepTools: Record<string, Tool> = {};
//         if (step.tool) {
//           if (!tools[step.tool]) throw new Error(`Tool not available: ${step.tool}`);
//           stepTools[step.tool] = tools[step.tool];
//         }

//         // Use the step description as the system prompt so the model 'knows' to execute the description
//         const systemPrompt = step.description;

//         const promptBody = `
//           Step title: ${step.title}

//           Input data:
//           """
//           ${JSON.stringify(stepInput)}
//           """

//           If you run a tool, return a JSON object containing the structured result and any data to pass to the next step.
//         `;

//         // Use streamText to get incremental chunks from the LLM for this step
//         const chunks: string[] = [];
//         const stepStreamPromise = new Promise<string>(async (resolve, reject) => {
//           try {
//             await streamText({
//               model,
//               system: systemPrompt,
//               prompt: promptBody,
//               tools: stepTools,
//               providerOptions: { openrouter: { transforms: ['middle-out'] } },
//               onChunk: (chunk: any) => {
//                 const text = String(chunk);
//                 chunks.push(text);
//                 // forward the raw chunk to caller if requested
//                 void Promise.resolve(onProgress?.({ stepId: step.id, order: step.order, title: step.title, status: 'started' }));
//                 void Promise.resolve(options?.onChunk?.({ stepId: step.id, order: step.order, chunk: text }));
//               },
//               onError: (err: any) => {
//                 reject(err);
//               },
//               onFinish: () => {
//                 resolve(chunks.join(''));
//               }
//             });
//           } catch (err) {
//             reject(err);
//           }
//         });

//         const modelResult = await Promise.race([stepStreamPromise, defaultTimeoutPromise(timeoutMs)]) as string;

//         try {
//           const parsed = JSON.parse(modelResult);
//           threadedInput = { ...threadedInput, ...parsed };
//           output = parsed;
//         } catch (e) {
//           threadedInput = { ...threadedInput, __lastStepText: modelResult };
//           output = modelResult;
//         }

//         success = true;
//       } catch (err) {
//         lastError = err;
//         // continue to next attempt if any
//       }
//     }

//     const elapsed = Date.now() - start;
//     if (success) {
//       results.push({ stepId: step.id, order: step.order, success: true, output, elapsedMs: elapsed });
//       await Promise.resolve(onProgress?.({ stepId: step.id, order: step.order, title: step.title, status: 'success', output, elapsedMs: elapsed }));
//     } else {
//       results.push({ stepId: step.id, order: step.order, success: false, error: lastError?.message ?? String(lastError), elapsedMs: elapsed });
//       await Promise.resolve(onProgress?.({ stepId: step.id, order: step.order, title: step.title, status: 'failed', error: lastError?.message ?? String(lastError), elapsedMs: elapsed }));
//       if (abortOnFailure) {
//         throw new Error(`Step failed after ${maxAttempts} attempts: ${step.id} - ${lastError?.message ?? String(lastError)}`);
//       }
//     }
//   }

//   return { success: true, steps: results };
// }

// /*
//  * === planExecutor.ts ===
//  * Updated: 2025-09-13 00:00
//  * Summary: Runs Plan steps sequentially with timeouts and a tool adapter.
//  */
