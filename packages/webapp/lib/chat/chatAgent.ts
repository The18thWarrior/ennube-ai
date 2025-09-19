import { LanguageModel, Tool, ModelMessage, UIMessage, streamText, stepCountIs, createUIMessageStreamResponse, AssistantModelMessage, SystemModelMessage } from "ai";
//import { StepProgress, ExecutorOptions, executePlanSequentially } from "./planExecutor";
import { orchestrator } from "./orchestrator";
import {nanoid} from "nanoid";

// export async function chatAgent_old({ model, systemPrompt, tools, _messages }: { model: LanguageModel; systemPrompt: string; tools: Record<string, Tool>; _messages: ModelMessage[]; }) {
//   // If the latest user message asked for a plan execution, attempt to generate a plan and run it.
//   // Heuristic: if the last user message includes the word "plan" or "execute steps" we will try to create a plan.
//   const lastMsg = _messages && _messages.length ? _messages[_messages.length - 1] : undefined;

//   const shouldGeneratePlan = lastMsg && !(/plan|steps|execute/i.test(String(lastMsg.content)));

//   if (shouldGeneratePlan) {
//     // Build a ModelMessage prompt object for taskManager
//     const promptMsg: ModelMessage = lastMsg as ModelMessage;

//     // Generate plan using taskManager
//     const plan = await orchestrator({ prompt: promptMsg, messageHistory: _messages, tools: tools });

//     // Create a ReadableStream that emits UI message events compatible with the SDK stream protocol
//     const stream = new ReadableStream({
//       async start(controller) {
//         const enqueue = (obj: any) => controller.enqueue(obj);

//         // generate simple ids
//         let messageCounter = 1;
//         const generateId = () => `msg-${Date.now()}-${messageCounter++}`;

//         // Emit start envelope similar to SDK
//         enqueue({ type: 'start' });

//         // Executor callbacks
//         const onProgress = async (ev: StepProgress) => {
//           // step start
//           enqueue({ type: 'start-step', id: ev.stepId, order: ev.order });
//         };

//         const onChunk = async (chunkEv: { stepId: string; order: number; chunk: string }) => {
//           // Emit text stream events: text-start (first chunk), text-delta, text-end when step completes
//           // For simplicity we use one text id per step
//           const textId = `text-${chunkEv.stepId}`;
//           // Send delta
//           enqueue({ type: 'text-delta', id: textId, delta: chunkEv.chunk });
//         };

//         const execOptions: ExecutorOptions = { timeoutMs: 60_000, retries: 1, abortOnFailure: true, onProgress, onChunk };

//         try {
//           // Execute plan; onChunk will stream incremental text deltas
//           await executePlanSequentially(plan, tools as Record<string, any>, execOptions);

//           // After all steps finish, emit end events
//           enqueue({ type: 'text-end' });
//           enqueue({ type: 'finish-step' });
//           enqueue({ type: 'finish', finishReason: 'completed' });
//         } catch (err: any) {
//           enqueue({ type: 'finish', finishReason: 'error', error: String(err.message || err) });
//         } finally {
//           controller.close();
//         }
//       }
//     });

//     return createUIMessageStreamResponse({ stream });
//   }

//   // Fallback: default chat streaming behavior
//   const result = await streamText({
//       model: model,
//       system: systemPrompt,
//       providerOptions: {
//         openrouter: {
//           transforms: ["middle-out"],
//           parallelToolCalls: false
//         }
//       },
//       tools: tools,
//       messages: _messages,
//       stopWhen: stepCountIs(5),
//       //toolCallStreaming: true,
//       onError: (error) => {
//         console.log('Error during tool execution:', error);
//       },
//       onFinish: (response) => {
//         console.log('Response finished:', response.finishReason);
//       },
//       onStepFinish: (step) => {
//         console.log('Step finished', step.finishReason);
//       },
      
//       //metadata: { subId: metadata.subId },
//     });
//     return result.toUIMessageStreamResponse();
// }

export async function chatAgent({ model, systemPrompt, tools, _messages }: { model: LanguageModel; systemPrompt: string; tools: Record<string, Tool>; _messages: ModelMessage[]; }) {
  // If the latest user message asked for a plan execution, attempt to generate a plan and run it.
  // Heuristic: if the last user message includes the word "plan" or "execute steps" we will try to create a plan.
  const lastMsg = _messages && _messages.length ? _messages[_messages.length - 1] : undefined;

  const shouldGeneratePlan = lastMsg && !(/plan|steps|execute/i.test(String(lastMsg.content)));

  if (shouldGeneratePlan) {
    // Build a ModelMessage prompt object for taskManager
    const promptMsg: ModelMessage = lastMsg as ModelMessage;

    // Generate plan using taskManager
    const plan = await orchestrator({ prompt: promptMsg, messageHistory: _messages, tools: tools });
    const planMessage = { role: 'assistant', content: `Generated plan:\n${JSON.stringify(plan, null, 2)}`, id: `plan-${nanoid()}` } as AssistantModelMessage;
    _messages.push(planMessage);
    //console.log('Generated plan:', JSON.stringify(plan, null, 2));
    console.log('Generated plan:', plan);
    // Create a ReadableStream that emits UI message events compatible with the SDK stream protocol
    const result = await streamText({
      model: model,
      system: systemPrompt,
      providerOptions: {
        openrouter: {
          transforms: ["middle-out"],
          parallelToolCalls: false
        }
      },
      tools: tools,
      messages: _messages,
      stopWhen: stepCountIs(5),
      //toolCallStreaming: true,
      onError: (error) => {
        console.log('Error during tool execution:', error);
      },
      onFinish: (response) => {
        console.log('Response finished:', response.finishReason);
      },
      onStepFinish: (step) => {
        console.log('Step finished', step.finishReason);
      },
      
      //metadata: { subId: metadata.subId },
    });
    return result.toUIMessageStreamResponse();
  }

  // Fallback: default chat streaming behavior
  const result = await streamText({
      model: model,
      system: systemPrompt,
      providerOptions: {
        openrouter: {
          transforms: ["middle-out"],
          parallelToolCalls: false
        }
      },
      tools: tools,
      messages: _messages,
      stopWhen: stepCountIs(5),
      //toolCallStreaming: true,
      onError: (error) => {
        console.log('Error during tool execution:', error);
      },
      onFinish: (response) => {
        console.log('Response finished:', response.finishReason);
      },
      onStepFinish: (step) => {
        console.log('Step finished', step.finishReason);
      },
      
      //metadata: { subId: metadata.subId },
  });
  return result.toUIMessageStreamResponse();
}