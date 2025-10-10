import { NextRequest, NextResponse } from 'next/server';
import { generateText, convertToModelMessages, stepCountIs } from 'ai';
import { auth } from '@/auth';
import getModel from '@/lib/chat/getModel';

// POST /api/chat/name-thread
export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const { messages } = body ?? {};
		if (!Array.isArray(messages)) {
			console.log('Missing or invalid messages in request body');
			return NextResponse.json({ error: 'Missing or invalid messages' }, { status: 400 });
		}

		// Require authenticated user (project convention)
		const session = await auth();
		if (!session?.user?.auth0?.sub) {
			return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
		}

		const model = getModel();
    if (!model) {
      return NextResponse.json({ error: 'AI model not configured' }, { status: 500 });
    }

		const systemPrompt = `Create a short and descriptive title based on the following user message. The title should be concise, under 10 words and 100 characters.`;

		const result = await generateText({
			model,
			system: systemPrompt,
			messages: convertToModelMessages(messages as any[][0]),
			providerOptions: {
				openrouter: {
					transforms: ['middle-out'],
				},
			},
		});

    //console.log(result);

		// read generated text
		const text = result.text ?? '';
		const name = String(text).trim().replace(/\s+/g, ' ');
		const truncated = name.length > 100 ? name.slice(0, 100).trim() : name;

		return NextResponse.json({ name: truncated });
	} catch (error) {
		console.log('Error in name-thread route:', error);
		return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
	}
}
