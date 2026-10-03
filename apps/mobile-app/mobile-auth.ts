import AsyncStorage from '@react-native-async-storage/async-storage';
import { getReactNativePersistence } from '@firebase/auth';
import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  initializeAuth,
  type Auth,
} from 'firebase/auth';

let auth: Auth | undefined;

export function getMobileAuth(): Auth {
  if (auth) return auth;

  const config = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  };

  if (!config.apiKey || !config.projectId || !config.appId) {
    throw new Error('Firebase sign-in is not configured for this app build.');
  }

  const firebaseApp = getApps().some((item) => item.name === 'fwaya-mobile')
    ? getApp('fwaya-mobile')
    : initializeApp(config, 'fwaya-mobile');

  auth = initializeAuth(firebaseApp, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
  return auth;
}
