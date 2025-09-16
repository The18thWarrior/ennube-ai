import { LanguageModel, Tool, ModelMessage, streamText, stepCountIs } from "ai";

export async function chatAgent({ model, systemPrompt, tools, _messages }: { model: LanguageModel; systemPrompt: string; tools: Record<string, Tool>; _messages: ModelMessage[]; }) {
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