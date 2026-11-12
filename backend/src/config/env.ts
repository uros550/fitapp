import fs from 'node:fs';
import path from 'node:path';
import { parseConfig, type Config } from './config';

//load backend/.env when it exists. Variables already set in the environment
//(for example on Render) take precedence over the file.
const envFile = path.resolve(__dirname, '../../.env');
const envFileFound = fs.existsSync(envFile);
if (envFileFound) {
  process.loadEnvFile(envFile);
}

function load(): Config {
  try {
    return parseConfig(process.env);
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Invalid environment configuration.';
    //the location of the .env file is not secret and makes a missing file obvious.
    throw new Error(`${reason}\n(.env file ${envFileFound ? 'found' : 'NOT found'} at ${envFile})`);
  }
}

export const config = load();