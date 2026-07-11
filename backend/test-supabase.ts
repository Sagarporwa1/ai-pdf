import 'dotenv/config';
import { makeSupabaseRetriever } from './src/shared/retrieval.js';

async function run() {
  try {
    const retriever = await makeSupabaseRetriever({k:1, filterKwargs:{}, retrieverProvider:'supabase'} as any);
    console.log("Vector store instantiated.");
    await retriever.vectorStore.addDocuments([{pageContent:"test", metadata:{}}]);
    console.log("Insert success.");
  } catch (e) {
    console.error("ERROR:", e);
  }
}
run();
