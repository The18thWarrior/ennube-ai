import { NextRequest, NextResponse } from 'next/server';
import { generateText, Output, streamText, tool, ToolExecutionOptions } from 'ai';
import { openai } from '@ai-sdk/openai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { z } from 'zod';
import { auth } from '@/auth';
import { getFieldsTool } from '@/lib/chat/getFieldsTool';
import { getDataTool } from '@/lib/chat/getDataTool';
import { getDataVisualizerTool } from '@/lib/chat/getDataVisualizerTool';
import { getCountTool } from '@/lib/chat/getCountTool';
import { getCredentialsTool } from '@/lib/chat/sfdc/getCredentialsTool';
import { nanoid } from 'nanoid';
import { setThread } from '@/lib/cache/message-history';

// System prompt for the Data Steward Agent
const DATA_STEWARD_SYSTEM_PROMPT = `As the dedicated AI guardian for CRM data quality and integrity, your sole mission is to enforce absolute standards of pristine contact records—ensuring they remain duplicate-free, error-proof, and free from any guesswork. Sparked into action during a critical compliance audit when corrupted contact records nearly derailed a major deal, you now serve as the silent crusader for impeccable data. Your unwavering commitment to clean, compliant data is vital for our organization’s reputation and operational success. When provided database data, always return a summary, not the raw data itself. Use any provided tools automatically as needed. When the user asks for anying 'they own', they are referring to records where the OwnerId is the user's id, which can be retrieved using the getCredentials tool.`; //When a tool returns data with the "directOutput" flag set to true, do NOT reformat, summarize or interpret the data. Instead, with EXACTLY the json that is contained within the 'data' property. When using the 'getData' and 'getCount' tools, you must always use the 'getCredentials' tool to access user information.
const PROSPECT_FINDER_SYSTEM_PROMPT = `You are Prospect Finder, an AI agent specialized in lead generation and prospect intelligence. You were forged during a startup’s Series A scramble—trained to hunt down decision-makers, zero in on ideal customers, and never waste time on cold leads. Your world is a fast-moving stream of signals, search results, and buyer intent breadcrumbs.
Your mission is to build a crystal-clear picture of the perfect prospect, then relentlessly pursue them across every channel. You’re not just finding leads—you’re creating a pipeline of opportunities that fuels growth and powers sales success. When provided database data, always return a summary, not the raw data itself. Use any provided tools automatically as needed. When the user asks for anying 'they own', they are referring to records where the OwnerId is the user's id, which can be retrieved using the getCredentials tool.`;
export const maxDuration = 30;
// The main agent route
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages } = body;
    if (!messages) {
      console.error('Missing messages in request body');
      return NextResponse.json({ error: 'Missing messages' }, { status: 400 });
    }

    const searchParams = req.nextUrl.searchParams;
    const agent = searchParams.get('agent') || 'data-steward';
    // Get the current session to identify the user
    const session = await auth();
    
    if (!session || !session.user || !session.user.auth0) {
      console.error('User is not authenticated');
      return NextResponse.json(
        { error: 'You must be signed in to access the data steward agent' },
        { status: 401 }
      );
    }
    
    // Get user's sub from the session
    const userSub = session.user.auth0.sub;
        
    const openrouter = createOpenRouter({
      apiKey: `${process.env.OPENROUTER_API_KEY}`,
    });
    const systemPrompt = agent === 'data-steward' ? DATA_STEWARD_SYSTEM_PROMPT : PROSPECT_FINDER_SYSTEM_PROMPT;
    const model = openrouter('google/gemini-2.0-flash-001'); // openai/gpt-4.1-nano | google/gemini-2.0-flash-001
    // Set up the OpenAI model
    // Run the agent with tools
    const result = await streamText({
      //model: openai('gpt-4.1-nano'),
      model: model,
      system: systemPrompt,
      tools: {
        getCredentials: getCredentialsTool(userSub),
        getFields: getFieldsTool(userSub),
        getData: getDataTool(userSub),
        getDataVisualizer: getDataVisualizerTool(model),
        getCount: getCountTool(userSub),
      },
      messages: messages.map((msg: any) => {
        return {
          role: msg.role,
          content: msg.content,
          toolCalls: msg.toolCalls || [],
          // If the message has tool calls, we need to include them in the response
          // so that the agent can use them in its next step
          ...(msg.toolCalls ? { toolCalls: msg.toolCalls } : {}),
        }
      }), 
      // experimental_output: Output.object({
      //   schema: z.object({
      //     message: z.string().describe('The message to return to the user.'),
      //     data: z.any().optional().describe('If available, the data to visualize or render for the user'),
      //     directOutput: z.boolean().optional().describe('If true, the agent should return the data as-is without formatting'),
      //   }),
      // }),
      // messages: [
      //   { role: 'user', content: messages.map((msg: any) => msg.content).join('\n') },
      // ],
      maxSteps: 10,
      toolCallStreaming: true,
      onError: (error) => {
        console.error('Error during tool execution:', error);
      },
      onFinish: (response) => {
        console.log('Response finished:', response.text, response.toolCalls, response.finishReason);
      },
      onStepFinish: (step) => {
        console.log('Step finished');
      },
      //metadata: { subId: metadata.subId },
    });

    return result.toDataStreamResponse();
    //return NextResponse.json(result);
  } catch (error) {
    console.error('Error in chat route:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.auth0?.sub) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userSub = session.user.auth0.sub;
  const searchParams = req.nextUrl.searchParams;
  const agent = searchParams.get('agent') || 'data-steward';
  // Get the chat history for the user
  const id = nanoid();
  await setThread(id, userSub, [], null);
  return NextResponse.json({id, agent}, { status: 200 });
}
