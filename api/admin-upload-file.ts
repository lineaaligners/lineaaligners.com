import type { IncomingMessage } from 'node:http';
import { formatAdminUploadError, getBearerToken, uploadAdminFile } from '../server/firebaseAdminUpload';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function readBody(req: IncomingMessage) {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = await readBody(req);
    const result = await uploadAdminFile({
      idToken: getBearerToken(req.headers.authorization),
      storagePath: String(req.headers['x-storage-path'] || ''),
      contentType: String(req.headers['x-content-type'] || 'application/octet-stream'),
      body,
      env: process.env,
    });

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Admin upload failed:', error);
    const formatted = formatAdminUploadError(error, process.env);
    return res.status(formatted.status).json({ error: formatted.error });
  }
}
