import knex from 'knex';
import { config } from '../config/env';

// The pool connects lazily, so the server starts even if the database is down.
export const db = knex({
  client: 'mysql2',
  connection: {
    host: config.DB_HOST,
    port: config.DB_PORT,
    user: config.DB_USER,
    password: config.DB_PASSWORD,
    database: config.DB_NAME,
    charset: 'utf8mb4',
    timezone: 'Z',
    connectTimeout: 3000,
  },
  pool: { min: 0, max: 5 },
  acquireConnectionTimeout: 3000,
});

// Used by the health check. Never throws, and logs only the reason (no credentials).
export async function isDatabaseAvailable(): Promise<boolean> {
  try {
    await db.raw('select 1');
    return true;
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'unknown error';
    console.error(`Database check failed: ${reason}`);
    return false;
  }
}