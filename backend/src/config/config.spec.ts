import { describe, expect, it } from 'vitest';
import { parseConfig } from './config';

const localEnv = {
  DB_HOST: '127.0.0.1',
  DB_PORT: '5432',
  DB_USER: 'fitapp_dev',
  DB_PASSWORD: 'arhipelago3',
  DB_NAME: 'fitapp_dev',
};

//returns the error message for an invalid configuration (empty if it was valid).
function errorMessage(env: NodeJS.ProcessEnv): string {
  try {
    parseConfig(env);
  } catch (error) {
    return error instanceof Error ? error.message : '';
  }
  return '';
}

describe('parseConfig', () => {
  it('accepts a local configuration and applies the defaults', () => {
    const config = parseConfig(localEnv);

    expect(config).toMatchObject({
      NODE_ENV: 'development',
      PORT: 3000,
      HOST: '127.0.0.1',
      DB_PORT: 5432,
      DB_SSL: 'disable',
    });
  });

  it('names every missing database variable', () => {
    const message = errorMessage({});

    for (const name of ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME']) {
      expect(message).toContain(name);
    }
  });

  it('rejects an invalid port', () => {
    expect(errorMessage({ ...localEnv, DB_PORT: 'abc' })).toContain('DB_PORT');
  });

  it('requires a CA file when the certificate must be verified', () => {
    expect(errorMessage({ ...localEnv, DB_SSL: 'verify' })).toContain('DB_CA_FILE');
  });

  it('accepts verify mode together with a CA file', () => {
    const config = parseConfig({ ...localEnv, DB_SSL: 'verify', DB_CA_FILE: 'ca.pem' });

    expect(config.DB_SSL).toBe('verify');
    expect(config.DB_CA_FILE).toBe('ca.pem');
  });

  it('rejects an encrypted mode that does not verify the certificate', () => {
    expect(errorMessage({ ...localEnv, DB_SSL: 'require' })).toContain('DB_SSL');
  });

  it('never prints the values it was given', () => {
    const message = errorMessage({
      ...localEnv,
      DB_PASSWORD: 'super-secret-value',
      DB_PORT: 'not-a-number',
    });

    expect(message).toContain('DB_PORT');
    expect(message).not.toContain('super-secret-value');
    expect(message).not.toContain('not-a-number');
  });
});