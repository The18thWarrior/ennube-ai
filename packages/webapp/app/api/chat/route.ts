import { NextRequest, NextResponse } from 'next/server';
import { convertToModelMessages, stepCountIs, streamText } from 'ai';
import { auth } from '@/auth';
import { nanoid } from 'nanoid';
import { setThread } from '@/lib/cache/message-history';
import { getPrompt, getTools } from '@/lib/chat/helper';
import dayjs from 'dayjs';
import getModel from '@/lib/chat/getModel';

export const maxDuration = 300;
// The main agent route
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages } = body;
    if (!messages) {
      console.log('Missing messages in request body');
      return NextResponse.json({ error: 'Missing messages' }, { status: 400 });
    }

    const searchParams = req.nextUrl.searchParams;
    const agent = searchParams.get('agent') || 'data-steward';
    // Get the current session to identify the user
    const session = await auth();
    
    if (!session || !session.user || !session.user.auth0) {
      console.log('User is not authenticated');
      return NextResponse.json(
        { error: 'You must be signed in to access the data steward agent' },
        { status: 401 }
      );
    }
    
    // Get user's sub from the session
    const userSub = session.user.auth0.sub;
    const today = dayjs().format('YYYY-MM-DD');
    const model = getModel('google/gemini-2.0-flash-001');
    if (!model) {
      return NextResponse.json({ error: 'AI model not configured' }, { status: 500 });
    }
    const systemPrompt = `${getPrompt(agent as 'data-steward' | 'prospect-finder' | 'contract-reader')} Today's date is ${today}.`;
    // Set up the OpenAI model
    // Run the agent with tools
    const result = await streamText({
      //model: openai('gpt-4.1-nano'),
      model: model,
      system: systemPrompt,
      providerOptions: {
        openrouter: {
          transforms: ["middle-out"],
          parallelToolCalls: false
        }
      },
      tools: await getTools(agent as 'data-steward' | 'prospect-finder' | 'contract-reader', userSub),
       messages: convertToModelMessages(messages),
      stopWhen: stepCountIs(10),
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
    //return NextResponse.json(result);
  } catch (error) {
    console.log('Error in chat route:', error);
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
  await setThread(id, userSub, [], null, agent);
  return NextResponse.json({id, agent}, { status: 200 });
}
