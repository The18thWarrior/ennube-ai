import { NextRequest, NextResponse } from 'next/server';
import { main as runBenchmark } from '../../.././benchmark/execute_benchmark';

// 300 seconds timeout
const TIMEOUT_MS = 300_000;

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Benchmarking is disabled in production' }, { status: 403 });
  }
  // Use Promise.race to enforce timeout
  const timeoutPromise = new Promise<{ status: number; body: any }>((resolve) => {
    const id = setTimeout(() => {
      clearTimeout(id);
      resolve({ status: 504, body: { error: 'Benchmark timed out after 300 seconds' } });
    }, TIMEOUT_MS);
  });

  const runPromise = (async () => {
    try {
      const { searchParams } = new URL(req.url);
      const { question } = await req.json();
      if (!question) {
        return { status: 400, body: { error: 'Missing question parameter' } };
      }
      const output = await runBenchmark(question);
      return { status: 200, body: output };
    } catch (err) {
      return { status: 500, body: { error: String(err) } };
    }
  })();

  const result = await Promise.race([timeoutPromise, runPromise]);

  if (result.status === 200) {
    return NextResponse.json(result.body, { status: 200 });
  }

  return NextResponse.json(result.body, { status: result.status });
}
