import { z } from 'zod';

const port = z.coerce.number().int().min(1).max(65535);

const schema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: port.default(3000),
    HOST: z.string().min(1).default('127.0.0.1'),
    FRONTEND_DIR: z.string().min(1).optional(),
    DB_HOST: z.string().min(1),
    DB_PORT: port,
    DB_USER: z.string().min(1),
    DB_PASSWORD: z.string().min(1),
    DB_NAME: z.string().min(1),
    //"disable" is for the local database; "verify" encrypts and checks the server certificate.
    DB_SSL: z.enum(['disable', 'verify']).default('disable'),
    DB_CA_FILE: z.string().min(1).optional(),
  })
  .refine((value) => value.DB_SSL !== 'verify' || value.DB_CA_FILE !== undefined, {
    path: ['DB_CA_FILE'],
    message: 'Required when DB_SSL is "verify"',
  });

export type Config = z.infer<typeof schema>;

export function parseConfig(env: NodeJS.ProcessEnv): Config {
  const parsed = schema.safeParse(env);

  if (!parsed.success) {
    //print only variable names and problems, never the values.
    const problems = parsed.error.issues.map(
      (issue) => `- ${issue.path.join('.')}: ${issue.message}`,
    );
    throw new Error(`Invalid environment configuration:\n${problems.join('\n')}`);
  }

  return parsed.data;
}