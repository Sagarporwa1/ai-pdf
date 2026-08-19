import { existsSync, writeFileSync } from 'fs';
import { spawn } from 'child_process';

// Ensure .env file exists (Render doesn't provide a .env file)
if (!existsSync('.env')) {
  writeFileSync('.env', '');
  console.log('[start] Created empty .env file');
}

// Resolve port - Render sets $PORT, fall back to 2024
const port = process.env.PORT || '2024';
const host = '0.0.0.0';

console.log(`[start] Starting LangGraph server on ${host}:${port}`);

const cli = spawn(
  'npx',
  [
    '@langchain/langgraph-cli',
    'dev',
    '--host', host,
    '--port', port,
    '--no-browser',
  ],
  {
    stdio: 'inherit',
    shell: true, // needed for npx on all platforms
    env: process.env,
  },
);

cli.on('error', (err) => {
  console.error('[start] Failed to start LangGraph server:', err);
  process.exit(1);
});

cli.on('exit', (code) => {
  console.log(`[start] LangGraph server exited with code ${code}`);
  process.exit(code ?? 0);
});
