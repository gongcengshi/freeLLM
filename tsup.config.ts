import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/cli.ts'],
  format: ['esm'],
  target: 'node20',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  splitting: false,
  bundle: true,
  external: [
    'better-sqlite3',
    'express',
    'cors',
    'helmet',
    'express-rate-limit',
    'pino',
    'pino-pretty',
    'dotenv',
  ],
  noExternal: [],
  minify: false,
  banner: {
    js: '#!/usr/bin/env node',
  },
});
