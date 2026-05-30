import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import type { IncomingMessage, ServerResponse } from 'http';
import { formatAdminUploadError, getBearerToken, uploadAdminFile } from './server/firebaseAdminUpload';

function json(res: ServerResponse, status: number, payload: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

async function readBody(req: IncomingMessage) {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        {
          name: 'linea-admin-upload-api',
          configureServer(server) {
            server.middlewares.use('/api/admin-upload-file', async (req, res) => {
              if (req.method !== 'POST') {
                return json(res, 405, { error: 'Method not allowed' });
              }

              try {
                const body = await readBody(req);
                const result = await uploadAdminFile({
                  idToken: getBearerToken(req.headers.authorization),
                  storagePath: String(req.headers['x-storage-path'] || ''),
                  contentType: String(req.headers['x-content-type'] || 'application/octet-stream'),
                  body,
                  env,
                });

                return json(res, 200, result);
              } catch (error: any) {
                console.error('Admin upload failed:', error);
                const formatted = formatAdminUploadError(error, env);
                return json(res, formatted.status, { error: formatted.error });
              }
            });
          },
        },
        react()
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
