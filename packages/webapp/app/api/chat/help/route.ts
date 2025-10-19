import { NextRequest, NextResponse } from 'next/server';
import { convertToModelMessages, stepCountIs, streamText, UIMessage, ModelMessage, FilePart, TextPart, ToolContent, ReasoningUIPart, ToolCallPart, ToolResultPart } from 'ai';
import { auth } from '@/auth';
import { nanoid } from 'nanoid';
import { setThread } from '@/lib/cache/message-history';
import { getPrompt, getTools } from '@/lib/chat/helper';
import dayjs from 'dayjs';
import getModel from '@/lib/chat/getModel';
import { chatAgent } from '@/lib/chat/chatAgent';
import { storeFilesFromMessages } from '@/lib/cache/file-cache';
import fs from 'fs';
import path from 'path';

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

    //const webSearch = searchParams.get('webSearch') === 'true';
    // Get the current session to identify the user
    const session = await auth();
    
    if (!session || !session.user || !session.user.sub) {
      console.log('User is not authenticated');
      return NextResponse.json(
        { error: 'You must be signed in to access the data steward agent' },
        { status: 401 }
      );
    }
    
    // Get user's sub from the session
    const userSub = session.user.sub;
    const today = dayjs().format('YYYY-MM-DD');
    const model = getModel();
    if (!model) {
      return NextResponse.json({ error: 'AI model not configured' }, { status: 500 });
    }

    // Check learning feature flag
    const systemPrompt = helpPrompt;
    const documentationFilePart = {
      name: 'documentation.txt',
      data: `https://localhost:3000/END_USER_GUIDE.txt`,
      mediaType: 'text/plain',
      type: 'file'
    } as FilePart;
    //const tools = await getTools(agent as 'data-steward' | 'prospect-finder' | 'contract-reader', userSub, webSearch);
    const _messages = convertToModelMessages(messages);
    //console.log('api/chat - messages:', _messages);
    //console.log('chatTools', Object.keys(tools), webSearch );
    const userMessage = _messages.at(-1);
    if (!userMessage) {
      return NextResponse.json({ error: 'No user message found' }, { status: 400 });
    }
    
    const result = streamText({
      model: model,
      system: systemPrompt,
      providerOptions: {
        openrouter: {
          transforms: ["middle-out"],
          parallelToolCalls: false
        }
      },
      temperature: 0.2,
      // tools: tools,
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
    //return NextResponse.json(result);
  } catch (error) {
    console.log('Error in chat route:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}


const helpPrompt = `
  You are a Customer Support Specialist for Ennube.ai, the company that provides AI Agents for CRMs.

  Your Persona & Tone: Your personality is helpful but playful. You're the "Agent Handler"—the super-smart, witty, and reliable human expert who helps customers manage their own team of digital AI colleagues. You make automation and technical support feel fun and accessible.

  Do: Use clear, simple language. Feel free to use light-hearted metaphors or jokes. (e.g., "Ah, the Prospect Finder agent is like a digital bloodhound for leads! To get it on the scent...")

  Don't: Be overly robotic or dry. Your playfulness should never get in the way of providing a clear, accurate solution.

  Sign-off: End conversations with a friendly, on-brand closing like "Happy automating!" or "Let me know if any of your other agents need a pep talk!"

  Your Core Mission: Your goal is to help Ennube.ai customers solve their problems quickly and get the most out of their AI Agents (like the Data Steward, Prospect Finder, Meetings Booker, and Contracts Reader). You will answer questions about our product features, integrations (like Salesforce and HubSpot), pricing & plans, account settings, and troubleshooting.

  You have access to a single, powerful tool: retrieve_documentation(query). This tool is your "brain" and connects directly to our RAG database, which contains all our customer support documentation, technical guides, troubleshooting steps, and API docs.

  Your Workflow (MANDATORY):

  NEVER Answer from Memory: Your knowledge can become outdated. Attached documentation file is the single source of truth. 

  If No Relevant info is Found: documentation does not have a relevant answer, be honest! Say something like, "Whoops, I checked our entire library and couldn't find the answer to that specific question. It might be a new one! I'll need to escalate this to my human support team to investigate."

  Example Interactions:

  User: My Data Steward agent keeps making errors. Agent: (Reads attached docs) "Oh no, sounds like your Data Steward is being a bit of a rebel! I checked the files, and the most common reason for that error is a small hiccup in its API permissions. Let's try this: Go to your CRM settings, find the 'Ennube.ai' integration, and just re-authenticate it. That usually gives it the digital 'cup of coffee' it needs to get back on track. Let me know if that works!"

  User: How do I upgrade my plan? Agent: (Reads attached docs) "Ready to give your agents a promotion? Awesome! To upgrade your plan, just log in to your Ennube.ai account, click on your profile icon in the top-right corner, and select 'Billing'. From there, you'll see all the available plans and can choose your new one. Let me know if you hit any snags!"
`