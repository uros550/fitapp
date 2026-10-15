import fs from 'node:fs';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { createApp, type AppOptions } from './app';

// Stand-ins for the real database check, so tests never touch a real database.
const databaseOk = async () => true;
const databaseDown = async () => false;

describe('backend app', () => {
  let server: Server | undefined;
  let frontendDir: string;

  beforeAll(() => {
    // A tiny fake "built Angular app" in a temporary folder.
    frontendDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fitapp-frontend-'));
    fs.writeFileSync(path.join(frontendDir, 'index.html'), '<html>FitApp index</html>');
    fs.writeFileSync(path.join(frontendDir, 'main.js'), 'console.log("main");');
  });

  afterAll(() => {
    fs.rmSync(frontendDir, { recursive: true, force: true });
  });

  afterEach(async () => {
    // Stop the server started by the test, so nothing keeps running.
    const running = server;
    server = undefined;
    if (running) {
      await new Promise<void>((resolve) => {
        running.close(() => resolve());
        running.closeAllConnections();
      });
    }
  });

  // Starts the app on any free port and returns its base URL.
  async function start(options: AppOptions): Promise<string> {
    const listening = createApp(options).listen(0, '127.0.0.1');
    server = listening;
    await new Promise<void>((resolve) => listening.once('listening', () => resolve()));
    const { port } = listening.address() as AddressInfo;
    return `http://127.0.0.1:${port}`;
  }

  describe('GET /api/health', () => {
    it('reports ok when the database answers', async () => {
      // Arrange: an app whose database check succeeds
      const baseUrl = await start({ checkDatabase: databaseOk });

      // Act: ask for the health status
      const response = await fetch(`${baseUrl}/api/health`);

      // Assert: HTTP 200 and exactly the simple status, nothing more
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ status: 'ok', database: 'ok' });
    });

    it('still answers 200 and reports the database as unavailable when it is down', async () => {
      const baseUrl = await start({ checkDatabase: databaseDown });

      const response = await fetch(`${baseUrl}/api/health`);

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ status: 'ok', database: 'unavailable' });
    });
  });

  describe('unknown API routes', () => {
    const notFound = { error: { code: 'NOT_FOUND', message: 'Resource not found.' } };

    it('return a JSON 404', async () => {
      const baseUrl = await start({ checkDatabase: databaseOk });

      const response = await fetch(`${baseUrl}/api/nothing`);

      expect(response.status).toBe(404);
      expect(await response.json()).toEqual(notFound);
    });

    it('return a JSON 404 even when the frontend is served', async () => {
      const baseUrl = await start({ checkDatabase: databaseOk, frontendDir });

      const response = await fetch(`${baseUrl}/api/nothing`);

      expect(response.status).toBe(404);
      expect(await response.json()).toEqual(notFound);
    });
  });

  describe('frontend', () => {
    it('serves static files', async () => {
      const baseUrl = await start({ checkDatabase: databaseOk, frontendDir });

      const response = await fetch(`${baseUrl}/main.js`);

      expect(response.status).toBe(200);
      expect(await response.text()).toContain('console.log("main")');
    });

    it('returns index.html for unknown pages so Angular routing can handle them', async () => {
      const baseUrl = await start({ checkDatabase: databaseOk, frontendDir });

      const response = await fetch(`${baseUrl}/some/page`);

      expect(response.status).toBe(200);
      expect(await response.text()).toContain('FitApp index');
    });

    it('is not served when no frontend folder is configured', async () => {
      const baseUrl = await start({ checkDatabase: databaseOk });

      const response = await fetch(`${baseUrl}/`);

      expect(response.status).toBe(404);
    });
  });
});