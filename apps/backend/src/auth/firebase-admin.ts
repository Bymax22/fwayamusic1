import * as admin from 'firebase-admin';
import serviceAccount from '../../serviceAccountKey.json'; // Correct relative path

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});

export const firebaseAdmin = admin;