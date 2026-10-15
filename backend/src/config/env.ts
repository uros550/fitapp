import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';

// Load backend/.env when it exists. Variables already set in the environment
// (for example on Render) take precedence over the file.
const envFile = path.resolve(__dirname, '../../.env');
if (fs.existsSync(envFile)) {
  process.loadEnvFile(envFile);
}

const port = z.coerce.number().int().min(1).max(65535);

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: port.default(3000),
  HOST: z.string().min(1).default('127.0.0.1'),
  FRONTEND_DIR: z.string().min(1).optional(),
  DB_HOST: z.string().min(1),
  DB_PORT: port,
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_NAME: z.string().min(1),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  // Print only variable names and problems, never the values.
  const problems = parsed.error.issues.map(
    (issue) => `- ${issue.path.join('.')}: ${issue.message}`,
  );
  throw new Error(`Invalid environment configuration:\n${problems.join('\n')}`);
}

export const config = parsed.data;