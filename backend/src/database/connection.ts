import fs from 'node:fs';
import knex from 'knex';
import { config } from '../config/env';

function readCaFile(file: string): string {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch {
    throw new Error(`Cannot read the CA certificate file set in DB_CA_FILE: ${file}`);
  }
}

function sslOptions() {
  if (config.DB_SSL === 'disable') {
    return false;
  }
  if (!config.DB_CA_FILE) {
    throw new Error('DB_CA_FILE is required when DB_SSL is "verify".');
  }
  //encrypts the connection and verifies both the certificate chain and the server name.
  return { ca: readCaFile(config.DB_CA_FILE), rejectUnauthorized: true };
}

//the pool connects lazily, so the server starts even if the database is down.
export const db = knex({
  client: 'pg',
  connection: {
    host: config.DB_HOST,
    port: config.DB_PORT,
    user: config.DB_USER,
    password: config.DB_PASSWORD,
    database: config.DB_NAME,
    ssl: sslOptions(),
    connectionTimeoutMillis: 3000,
    application_name: 'fitapp-backend',
  },
  pool: { min: 0, max: 5 },
  acquireConnectionTimeout: 3000,
});

//used by the health check. Never throws, and logs only the reason (no credentials).
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