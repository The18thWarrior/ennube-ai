import { NextRequest } from 'next/server';
import { MultiAgentOrchestrator } from '@/lib/chat/multi-agent/orchestrator';
import { MultiAgentRequestSchema } from '@/lib/chat/multi-agent/types';
import { auth } from '@/auth';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !session.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const parsed = MultiAgentRequestSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'Validation failed', details: parsed.error.flatten() }), { status: 400 });
  }

  const { agents, rounds, messages } = parsed.data;
  const orchestrator = new MultiAgentOrchestrator(session.user?.email || 'unknown', agents, rounds);

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of orchestrator.executeConversation(messages)) {
          controller.enqueue(`data: ${JSON.stringify(chunk)}\n\n`);
        }
        controller.close();
      } catch (err) {
        controller.enqueue(`data: ${JSON.stringify({ type: 'error', data: { error: (err as any).message || String(err) } })}\n\n`);
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    }
  });
}
