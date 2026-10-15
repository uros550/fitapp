import path from 'node:path';
import express from 'express';

export interface AppOptions {
  /** Folder with the built Angular app. When omitted, only the API is served. */
  frontendDir?: string;
}

export function createApp(options: AppOptions = {}) {
  const app = express();

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // Unknown API routes must never fall through to the frontend.
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Resource not found.' } });
  });

  const { frontendDir } = options;
  if (frontendDir) {
    app.use(express.static(frontendDir));

    // Single-page app: any other GET request gets index.html, so Angular routing can handle it.
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(frontendDir, 'index.html'));
    });
  }

  return app;
}