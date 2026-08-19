import { Client } from '@langchain/langgraph-sdk';
import { LangGraphBase } from './langgraph-base';

/**
 * Creates a LangGraph client for server-side use with dynamic API URL resolution
 */
export const createServerClient = () => {
  const apiUrl =
    process.env.LANGGRAPH_API_URL ||
    process.env.NEXT_PUBLIC_LANGGRAPH_API_URL ||
    'http://localhost:2024';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (process.env.LANGCHAIN_API_KEY) {
    headers['X-Api-Key'] = process.env.LANGCHAIN_API_KEY;
  }

  const client = new Client({
    apiUrl,
    defaultHeaders: headers,
  });

  return new LangGraphBase(client);
};
