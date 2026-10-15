import fs from 'node:fs';
import path from 'node:path';
import { createApp } from './app';
import { config } from './config/env';
import { isDatabaseAvailable } from './database/connection';

const frontendDir =
  config.FRONTEND_DIR ?? path.resolve(__dirname, '../../frontend/dist/frontend/browser');
const hasFrontend = fs.existsSync(path.join(frontendDir, 'index.html'));

if (!hasFrontend) {
  console.warn(`Frontend build not found at ${frontendDir}. Serving the API only.`);
}

const app = createApp({
  checkDatabase: isDatabaseAvailable,
  frontendDir: hasFrontend ? frontendDir : undefined,
});

app.listen(config.PORT, config.HOST, () => {
  console.log(`Server listening on http://${config.HOST}:${config.PORT}`);
});