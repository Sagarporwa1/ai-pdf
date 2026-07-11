import 'dotenv/config';
import { graph } from './src/retrieval_graph/graph.js';
import { HumanMessage } from '@langchain/core/messages';

async function test() {
  try { 
    const config = {
      configurable: {
        queryModel: 'groq/llama-3.3-70b-versatile',
        retrieverProvider: 'supabase' as const,
        filterKwargs: {},
        k: 5,
      },
    };
    console.log('Invoking graph...');
    const result = await graph.invoke({
      query: "hello",
      messages: [new HumanMessage("hello")]
    }, config);
    console.log('Result:', result);
  } catch (e) {
    console.error('CRASHED EXACTLY HERE:', e);
  }
}

test();
