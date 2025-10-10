import { NextRequest, NextResponse } from 'next/server';
import { convertToModelMessages, stepCountIs, streamText, UIMessage } from 'ai';
import { auth } from '@/auth';
import { nanoid } from 'nanoid';
import { setThread } from '@/lib/cache/message-history';
import { getPrompt, getTools } from '@/lib/chat/helper';
import dayjs from 'dayjs';
import getModel from '@/lib/chat/getModel';
import { chatAgent } from '@/lib/chat/chatAgent';
import { storeFilesFromMessages } from '@/lib/cache/file-cache';

export const maxDuration = 300;
// The main agent route
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, webSearch } = body as { messages: UIMessage[]; webSearch?: boolean };
    if (!messages) {
      console.log('Missing messages in request body');
      return NextResponse.json({ error: 'Missing messages' }, { status: 400 });
    }

    const searchParams = req.nextUrl.searchParams;
    const agent = searchParams.get('agent') || 'data-steward';
    //const webSearch = searchParams.get('webSearch') === 'true';
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
    const model = getModel();
    if (!model) {
      return NextResponse.json({ error: 'AI model not configured' }, { status: 500 });
    }

    // Check learning feature flag
    const learningEnabled = process.env.LEARNING_FLAG === 'true';

    await storeFilesFromMessages(messages, userSub);
    const systemPrompt = `${await getPrompt(agent as 'data-steward' | 'prospect-finder' | 'contract-reader')} Today's date is ${today}.`;
    const tools = await getTools(agent as 'data-steward' | 'prospect-finder' | 'contract-reader', userSub, webSearch);
    const _messages = convertToModelMessages(messages);
    //console.log('api/chat - messages:', _messages);
    //console.log('chatTools', Object.keys(tools), webSearch );
    const userMessage = _messages.at(-1);
    if (!userMessage) {
      return NextResponse.json({ error: 'No user message found' }, { status: 400 });
    }
    // Set up the OpenAI model
    // Run the agent with tools
    //const steps = await taskManager({ prompt: userMessage, messageHistory: _messages.slice(0, -1), tools: Object.keys(tools).map(t => ({ name: t, description: tools[t].description })) });
    return chatAgent({ model, systemPrompt, tools, _messages, userSub, agent: agent as string, learningEnabled });
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
