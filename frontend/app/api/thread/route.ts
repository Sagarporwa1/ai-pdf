import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/langgraph-server';

// Allow up to 60 seconds - gives Render free tier time to wake up
export const maxDuration = 60;

export async function POST() {
  const maxRetries = 4;
  let lastError: any = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const serverClient = createServerClient();
      const thread = await serverClient.createThread();
      return NextResponse.json(thread);
    } catch (error: any) {
      lastError = error;
      console.warn(`Thread creation attempt ${attempt}/${maxRetries} failed:`, error?.message || error);

      if (attempt < maxRetries) {
        // Progressive wait: 5s, 10s, 15s — gives Render cold start time to wake up
        const waitMs = attempt * 5000;
        console.log(`Waiting ${waitMs / 1000}s before retry...`);
        await new Promise((resolve) => setTimeout(resolve, waitMs));
      }
    }
  }

  return NextResponse.json(
    {
      error: `Unable to connect to LangGraph server. Please ensure the server is running and accessible. Original error: ${lastError?.message || lastError}`,
    },
    { status: 500 },
  );
}
