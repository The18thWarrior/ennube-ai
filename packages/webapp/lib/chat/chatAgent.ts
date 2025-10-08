import { LanguageModel, Tool, ModelMessage, UIMessage, streamText, stepCountIs, createUIMessageStreamResponse, AssistantModelMessage, SystemModelMessage, createUIMessageStream } from "ai";
//import { StepProgress, ExecutorOptions, executePlanSequentially } from "./planExecutor";
import { orchestrator } from "./orchestrator";
import {nanoid} from "nanoid";
import { memoryRetriever, memoryWriter } from "../memory";
import { createHash } from "crypto";

export async function chatAgent({ 
  model, 
  systemPrompt, 
  tools, 
  _messages, 
  userSub, 
  agent, 
  learningEnabled 
}: { 
  model: LanguageModel; 
  systemPrompt: string; 
  tools: Record<string, Tool>; 
  _messages: ModelMessage[];
  userSub: string;
  agent: string;
  learningEnabled: boolean;
}) {
  // If the latest user message asked for a plan execution, attempt to generate a plan and run it.
  // Heuristic: if the last user message includes the word "plan" or "execute steps" we will try to create a plan.
  const lastMsg = _messages && _messages.length ? _messages[_messages.length - 1] : undefined;
  //console.log('chatAgent - lastMsg:', lastMsg);
  // Memory retrieval for learning-enabled agents
  let memoryContext = '';
  let referenceCaseIds: string[] = [];
  if (learningEnabled && lastMsg) {
    // try {
    //   const queryText = String(lastMsg.content);
    //   const memoryResult = await memoryRetriever.retrieveMemories(userSub, agent, queryText, 4);
    //   memoryContext = memoryRetriever.formatMemoryContext(memoryResult.cases);
    //   referenceCaseIds = memoryResult.cases.map(c => c.id);
    // } catch (error) {
    //   console.warn('Memory retrieval failed:', error);
    // }
  }

  const shouldGeneratePlan = lastMsg && !(/plan|steps|execute/i.test(String(lastMsg.content)));

  if (shouldGeneratePlan) {
    // Build a ModelMessage prompt object for taskManager
    const promptMsg: ModelMessage = lastMsg as ModelMessage;
    const stream = createUIMessageStream<UIMessage>({
      execute: async ({ writer }) => {
        // 1. Send initial status (transient - won't be added to message history)
        writer.write({
          type: 'data-planning',
          data: { message: 'Planning your request...', level: 'info' },
          transient: false, // This part won't be added to message history
        });
        // Generate plan using taskManager
        console.log('entering plan generation');
        const plan = await orchestrator({ prompt: promptMsg, messageHistory: _messages, tools: tools, memoryContext, referenceCaseIds });
        console.log('plan generated');
        const planMessage = { role: 'assistant', content: `Generated plan:\n${JSON.stringify(plan, null, 2)}`, id: `plan-${nanoid()}` } as AssistantModelMessage;
        _messages.push(planMessage);
        //console.log('Generated plan:', JSON.stringify(plan, null, 2));
        //console.log('Generated plan:', plan);
        // Create a ReadableStream that emits UI message events compatible with the SDK stream protocol
        console.log('creating stream');
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
            console.log('Error during execution:', error);
          },
          onFinish: (response) => {
            console.log('Response finished:', response.finishReason);
            // Memory write-back
            // if (learningEnabled) {
            //   try {
            //     const messageHash = createHash('sha256').update(JSON.stringify(lastMsg)).digest('hex');
            //     await memoryWriter.enqueue({
            //       userSub,
            //       agentKey: agent,
            //       messageHash,
            //       promptSnapshot: { query: String(lastMsg.content), systemPrompt },
            //       planSummary: plan,
            //       toolTraces: response.toolCalls ? Object.fromEntries(
            //         response.toolCalls.map(call => [call.toolCallId, { 
            //           name: call.toolName,
            //           success: true // TODO: determine success from result
            //         }])
            //       ) : {},
            //       outcome: response.finishReason === 'stop' ? 'success' : 'failure',
            //       tags: [], // TODO: extract tags from content
            //       referenceCaseIds,
            //     });
            //   } catch (error) {
            //     console.warn('Memory write-back failed:', error);
            //   }
            // }
          },
          onStepFinish: (step) => {
            console.log('Step finished', step.finishReason);
          },
          
          //metadata: { subId: metadata.subId },
        });
        //return result.toUIMessageStreamResponse();

        writer.merge(result.toUIMessageStream());
      },
    });

    return createUIMessageStreamResponse({ stream });
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
        // Memory write-back for fallback case
        // if (learningEnabled && lastMsg) {
        //   try {
        //     const messageHash = createHash('sha256').update(JSON.stringify(lastMsg)).digest('hex');
        //     await memoryWriter.enqueue({
        //       userSub,
        //       agentKey: agent,
        //       messageHash,
        //       promptSnapshot: { query: String(lastMsg.content), systemPrompt },
        //       planSummary: undefined, // No plan generated
        //       toolTraces: response.toolCalls ? Object.fromEntries(
        //         response.toolCalls.map(call => [call.toolCallId, { 
        //           name: call.toolName,
        //           success: true // TODO: determine success from result
        //         }])
        //       ) : {},
        //       outcome: response.finishReason === 'stop' ? 'success' : 'failure',
        //       tags: [],
        //       referenceCaseIds,
        //     });
        //   } catch (error) {
        //     console.warn('Memory write-back failed:', error);
        //   }
        // }
      },
      onStepFinish: (step) => {
        console.log('Step finished', step.finishReason);
      },
      
      //metadata: { subId: metadata.subId },
  });
  return result.toUIMessageStreamResponse();
}