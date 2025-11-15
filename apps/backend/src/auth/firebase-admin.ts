import * as admin from 'firebase-admin';

// Load service account from env (supports raw JSON or base64-encoded JSON)
const raw = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.SERVICE_ACCOUNT_JSON || '';

let serviceAccount: admin.ServiceAccount | undefined;

if (raw) {
  try {
    const trimmed = raw.trim();
    const parsed = trimmed.startsWith('{')
      ? JSON.parse(trimmed)
      : JSON.parse(Buffer.from(trimmed, 'base64').toString('utf8'));
    serviceAccount = parsed as admin.ServiceAccount;
  } catch (err) {
    // Do not throw at build time — log and continue so builds don't fail.
    // ...existing code...
    // eslint-disable-next-line no-console
    console.error('Invalid FIREBASE_SERVICE_ACCOUNT:', (err as Error).message);
  }
}

if (serviceAccount && !admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export const firebaseAdmin = admin;