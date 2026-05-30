import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

type Env = Record<string, string | undefined>;

export const firebaseConfig = JSON.parse(readFileSync(resolve('firebase-applet-config.json'), 'utf-8'));
const ADMIN_EMAIL = 'nallbanigeno@gmail.com';

function envValue(env: Env | undefined, key: string) {
  return env?.[key] || process.env[key];
}

function parseServiceAccount(raw: string, source: string) {
  try {
    return JSON.parse(raw);
  } catch {
    const error = new Error(`${source} must contain valid Firebase service-account JSON`);
    Object.assign(error, { status: 500 });
    throw error;
  }
}

function getCredential(env?: Env) {
  const rawJson = envValue(env, 'FIREBASE_SERVICE_ACCOUNT_KEY') || envValue(env, 'FIREBASE_SERVICE_ACCOUNT');
  const base64Json = envValue(env, 'FIREBASE_SERVICE_ACCOUNT_BASE64');
  const filePath = envValue(env, 'FIREBASE_SERVICE_ACCOUNT_FILE') || envValue(env, 'GOOGLE_APPLICATION_CREDENTIALS');

  if (rawJson) return admin.credential.cert(parseServiceAccount(rawJson, 'FIREBASE_SERVICE_ACCOUNT_KEY'));
  if (base64Json) {
    const decoded = Buffer.from(base64Json, 'base64').toString('utf-8');
    return admin.credential.cert(parseServiceAccount(decoded, 'FIREBASE_SERVICE_ACCOUNT_BASE64'));
  }
  if (filePath) return admin.credential.cert(JSON.parse(readFileSync(resolve(filePath), 'utf-8')));

  return admin.credential.applicationDefault();
}

export function getConfiguredStorageBucket(env?: Env) {
  return (envValue(env, 'FIREBASE_STORAGE_BUCKET') || firebaseConfig.storageBucket || '').replace(/^gs:\/\//, '').replace(/\/$/, '');
}

export function getFirebaseAdminApp(env?: Env) {
  if (admin.apps.length) return admin.apps[0]!;

  return admin.initializeApp({
    projectId: firebaseConfig.projectId,
    storageBucket: getConfiguredStorageBucket(env),
    credential: getCredential(env),
  });
}

export function getAdminDb(app = getFirebaseAdminApp()) {
  return firebaseConfig.firestoreDatabaseId
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);
}

export function getBearerToken(header: string | string[] | undefined) {
  const value = Array.isArray(header) ? header[0] : header || '';
  const [scheme, token] = value.split(' ');
  return scheme?.toLowerCase() === 'bearer' ? token : null;
}

async function isAdminRequest(app: admin.app.App, uid: string, email?: string) {
  if (email?.toLowerCase() === ADMIN_EMAIL) return true;

  const adminDoc = await getAdminDb(app).collection('admins').doc(uid).get();
  return adminDoc.exists;
}

function httpError(status: number, message: string) {
  return Object.assign(new Error(message), { status });
}

async function responseError(response: Response, fallback: string) {
  const text = await response.text();
  try {
    const parsed = JSON.parse(text);
    return parsed?.error?.message || parsed?.error || fallback;
  } catch {
    return text || fallback;
  }
}

async function lookupFirebaseUser(idToken: string) {
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseConfig.apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });

  if (!response.ok) {
    throw httpError(401, await responseError(response, 'Admin session expired. Please sign in again.'));
  }

  const payload: any = await response.json();
  const user = payload.users?.[0];
  if (!user?.localId) {
    throw httpError(401, 'Admin session expired. Please sign in again.');
  }

  return { uid: String(user.localId), email: String(user.email || '') };
}

async function adminDocExists(idToken: string, uid: string) {
  const databaseId = firebaseConfig.firestoreDatabaseId || '(default)';
  const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(firebaseConfig.projectId)}/databases/${encodeURIComponent(databaseId)}/documents/admins/${encodeURIComponent(uid)}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${idToken}` },
  });

  if (response.ok) return true;
  if (response.status === 404) return false;

  throw httpError(403, await responseError(response, 'Could not verify admin role.'));
}

export async function verifyLoggedInAdmin(idToken: string | null) {
  if (!idToken) {
    throw httpError(401, 'Missing Firebase ID token');
  }

  const user = await lookupFirebaseUser(idToken);
  if (user.email.toLowerCase() === ADMIN_EMAIL) return user;
  if (await adminDocExists(idToken, user.uid)) return user;

  throw httpError(403, 'Only admins can perform this action');
}

function getDownloadToken(metadata: any) {
  const tokens = metadata?.downloadTokens || metadata?.metadata?.firebaseStorageDownloadTokens;
  return typeof tokens === 'string' ? tokens.split(',')[0] : null;
}

async function getStorageMetadata(idToken: string, bucketName: string, storagePath: string) {
  const url = `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucketName)}/o/${encodeURIComponent(storagePath)}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Firebase ${idToken}`,
      'X-Firebase-Storage-Version': 'webjs/server',
    },
  });

  if (!response.ok) {
    throw httpError(response.status, await responseError(response, 'Could not read uploaded file metadata'));
  }

  return response.json();
}

async function uploadWithFirebaseToken({
  idToken,
  storagePath,
  contentType,
  body,
  env,
}: {
  idToken: string;
  storagePath: string;
  contentType: string;
  body: Buffer;
  env?: Env;
}) {
  const bucketName = getConfiguredStorageBucket(env);
  if (!bucketName) {
    throw httpError(500, 'Firebase storageBucket is not configured');
  }

  const boundary = `linea-${randomUUID()}`;
  const metadata = {
    name: storagePath,
    contentType,
  };
  const prelude = Buffer.from(
    `--${boundary}\r\n` +
      'Content-Type: application/json; charset=utf-8\r\n\r\n' +
      `${JSON.stringify(metadata)}\r\n` +
      `--${boundary}\r\n` +
      `Content-Type: ${contentType}\r\n\r\n`
  );
  const ending = Buffer.from(`\r\n--${boundary}--`);
  const uploadBody = Buffer.concat([prelude, body, ending]);
  const url = `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucketName)}/o?name=${encodeURIComponent(storagePath)}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Firebase ${idToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
      'X-Goog-Upload-Protocol': 'multipart',
      'X-Firebase-Storage-Version': 'webjs/server',
    },
    body: uploadBody as any,
  });

  if (!response.ok) {
    throw httpError(response.status, await responseError(response, 'Upload failed'));
  }

  const uploadMetadata = await response.json();
  const downloadToken = getDownloadToken(uploadMetadata) || getDownloadToken(await getStorageMetadata(idToken, bucketName, storagePath));
  if (!downloadToken) {
    throw httpError(500, 'Firebase Storage uploaded the file but did not return a download token.');
  }

  const encodedPath = encodeURIComponent(storagePath);
  const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedPath}?alt=media&token=${downloadToken}`;

  return { storagePath, downloadUrl };
}

export async function uploadAdminFile({
  idToken,
  storagePath,
  contentType,
  body,
  env,
}: {
  idToken: string | null;
  storagePath: string;
  contentType: string;
  body: Buffer;
  env?: Env;
}) {
  if (!idToken) {
    throw Object.assign(new Error('Missing Firebase ID token'), { status: 401 });
  }
  if (!storagePath || storagePath.includes('..') || !storagePath.includes('/documents/')) {
    throw Object.assign(new Error('Invalid storage path'), { status: 400 });
  }
  if (!Buffer.isBuffer(body) || body.length === 0) {
    throw Object.assign(new Error('Missing file body'), { status: 400 });
  }

  await verifyLoggedInAdmin(idToken);
  return uploadWithFirebaseToken({ idToken, storagePath, contentType, body, env });
}

export function formatAdminUploadError(error: any, env?: Env) {
  const message = String(error?.message || '');
  const missingCredentials = message.includes('Could not load the default credentials');
  const missingBucket = error?.code === 404 || message.includes('does not exist') || message.includes('No such object') || message.includes('Not Found');
  const storageDenied = error?.status === 403 && message.toLowerCase().includes('permission');

  return {
    status: error?.status || 500,
    error: missingCredentials
      ? 'Firebase Admin credentials are not configured. Set FIREBASE_SERVICE_ACCOUNT_BASE64 or FIREBASE_SERVICE_ACCOUNT_KEY in .env.local and in hosted environment variables.'
      : missingBucket
        ? `Firebase Storage bucket not found: ${getConfiguredStorageBucket(env)}. Create/enable Firebase Storage or set FIREBASE_STORAGE_BUCKET to the real bucket name.`
        : storageDenied
          ? 'Firebase Storage rules blocked this upload. Allow the admin email to write to users/*/documents/* and patients/*/documents/*.'
          : message || 'Upload failed',
  };
}
