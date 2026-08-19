import { NextResponse } from 'next/server';
import { langGraphServerClient } from '@/lib/langgraph-server';

export async function POST() {
  try {
    const thread = await langGraphServerClient.createThread();
    return NextResponse.json(thread);
  } catch (error: any) {
    console.error('Error creating thread server-side:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create thread' },
      { status: 500 },
    );
  }
}
