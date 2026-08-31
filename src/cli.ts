#!/usr/bin/env node

import 'dotenv/config';
import { Command } from 'commander';
import { generateProxyKey } from './utils/crypto.js';

const program = new Command();

program
  .name('freellm')
  .description('FreeLLM - Free LLM API Gateway')
  .version('0.1.0');

program
  .command('start')
  .description('Start the FreeLLM server')
  .option('-p, --port <port>', 'Port to listen on', '3001')
  .option('-h, --host <host>', 'Host to bind to', '0.0.0.0')
  .action(async (options) => {
    process.env.PORT = options.port;
    process.env.HOST = options.host;
    await import('./index.js');
  });

program
  .command('generate-key')
  .description('Generate a new proxy API key')
  .action(() => {
    const key = generateProxyKey();
    console.log('Generated proxy API key:');
    console.log(key);
    console.log('\nAdd this to your .env file:');
    console.log(`PROXY_API_KEY=${key}`);
  });

program.parse(process.argv);
