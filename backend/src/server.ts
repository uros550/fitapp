import fs from 'node:fs';
import path from 'node:path';
import { createApp } from './app';

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? '127.0.0.1';

const frontendDir =
  process.env.FRONTEND_DIR ?? path.resolve(__dirname, '../../frontend/dist/frontend/browser');
const hasFrontend = fs.existsSync(path.join(frontendDir, 'index.html'));

if (!hasFrontend) {
  console.warn(`Frontend build not found at ${frontendDir}. Serving the API only.`);
}

const app = createApp({ frontendDir: hasFrontend ? frontendDir : undefined });

app.listen(port, host, () => {
  console.log(`Server listening on http://${host}:${port}`);
});