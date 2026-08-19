import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/langgraph-server';

export async function POST() {
  const maxRetries = 3;
  let lastError: any = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const serverClient = createServerClient();
      const thread = await serverClient.createThread();
      return NextResponse.json(thread);
    } catch (error: any) {
      lastError = error;
      console.warn(`Thread creation attempt ${attempt} failed:`, error?.message || error);
      if (attempt < maxRetries) {
        // Wait 3 seconds before retrying (gives Render free-tier time to wake up)
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
  }

  return NextResponse.json(
    {
      error: `Could not connect to backend server after ${maxRetries} attempts. ${lastError?.message || lastError}`,
    },
    { status: 500 },
  );
}
