import type { Persistence } from '@firebase/auth';

// Firebase's React Native entrypoint exports this helper, unlike its shared declarations.
declare module '@firebase/auth' {
  export function getReactNativePersistence(
    storage: typeof import('@react-native-async-storage/async-storage').default
  ): Persistence;
}
