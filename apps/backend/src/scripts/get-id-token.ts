import * as admin from 'firebase-admin';
import axios from 'axios';
import { config } from 'dotenv';
import { Logger } from '@nestjs/common';

// Initialize logger
const logger = new Logger('GetIdToken');

// Load environment variables
config();

// Helper to validate environment variables
function getRequiredEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    logger.error(`Missing required environment variable: ${name}`);
    process.exit(1);
  }
  return value;
}

async function generateTestUser() {
  try {
    // 1. Get validated environment variables
    const projectId = getRequiredEnvVar('FIREBASE_PROJECT_ID');
    const clientEmail = getRequiredEnvVar('FIREBASE_CLIENT_EMAIL');
    const privateKey = getRequiredEnvVar('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n');
    const webApiKey = getRequiredEnvVar('FIREBASE_WEB_API_KEY');

    // 2. Initialize Firebase Admin
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey
      })
    });

    // 3. Create test user with complete claims
    const testUid = `test-${Date.now()}`;
    const testEmail = `test-${testUid}@yourdomain.com`;
    
    await admin.auth().createUser({
      uid: testUid,
      email: testEmail,
      emailVerified: true,
      displayName: 'Test User'
    });

    // 4. Set custom claims
    await admin.auth().setCustomUserClaims(testUid, {
      provider: 'google',
      email: testEmail,
      email_verified: true
    });

    // 5. Generate custom token
    const customToken = await admin.auth().createCustomToken(testUid);

    // 6. Exchange for ID token
    const { data } = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${webApiKey}`,
      { token: customToken, returnSecureToken: true }
    );

    if (!data.idToken) {
      throw new Error('Failed to get ID token');
    }

    logger.log('Successfully generated test user and ID token');
    return {
      uid: testUid,
      email: testEmail,
      idToken: data.idToken,
      refreshToken: data.refreshToken
    };
  } catch (error) {
    logger.error('Test user generation failed', error);
    process.exit(1);
  }
}

// Execute and output results
generateTestUser()
  .then(({ idToken }) => {
    console.log('ID Token:', idToken);
    process.exit(0);
  })
  .catch(() => process.exit(1));