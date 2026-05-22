export type AuthErrorInfo = {
  message: string;
  redirectTo?: string;
  redirectLabel?: string;
};

const roleNames: Record<string, string> = {
  USER: 'listener',
  ARTIST: 'artist',
  RESELLER: 'reseller',
  PRODUCER: 'producer',
};

const roleSignInPaths: Record<string, string> = {
  USER: '/auth/user/signin',
  ARTIST: '/auth/artist/signin',
  RESELLER: '/auth/reseller/signin',
  PRODUCER: '/auth/producer/signin',
};

const sanitizeErrorText = (message: string) => {
  return message
    .replace(/^Firebase:\s*/i, '')
    .replace(/\s*\([^)]*auth\/[^)]+\)\.?$/i, '')
    .replace(/\s*\([^)]*\)$/, '')
    .trim();
};

export const getFriendlyFirebaseError = (error: Error) => {
  const firebaseError = error as { code?: string; message?: string };
  switch (firebaseError.code) {
    case 'auth/user-not-found':
      return 'No account was found with that email. Please sign up or check your email and try again.';
    case 'auth/wrong-password':
      return 'The password is incorrect. Please try again or reset your password.';
    case 'auth/invalid-email':
      return 'That email address is invalid. Please check it and try again.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Contact support if you need help.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in was cancelled. Please try again.';
    case 'auth/popup-blocked':
      return 'The sign-in popup was blocked. Please allow popups or try a different browser.';
    case 'auth/cancelled-popup-request':
      return 'The sign-in request was cancelled. Please try again.';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with this email using a different sign-in method. Use the original sign-in option.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    case 'auth/too-many-requests':
      return 'Too many attempts were made. Please wait a moment and try again.';
    case 'auth/email-already-in-use':
      return 'This email is already registered. Please sign in instead or use a different email.';
    case 'auth/weak-password':
      return 'Password is too weak. Please choose a stronger password.';
    case 'auth/operation-not-allowed':
      return 'This sign-in method is disabled. Please contact support.';
    default:
        return firebaseError.message
          ? sanitizeErrorText(firebaseError.message)
          : 'An unexpected error occurred. Please try again.';
  }
};

export const getRoleMismatchMessage = (actualRole: string, expectedRole?: string) => {
  const actual = roleNames[actualRole] || actualRole.toLowerCase();
  const expected = expectedRole ? roleNames[expectedRole] || expectedRole.toLowerCase() : undefined;

  if (actualRole === 'USER') {
    return 'This email is registered as a listener account. Please use the listener sign-in page.';
  }

  if (expectedRole === 'USER') {
    return `This email is registered as a ${actual} account. Please use the ${actual} sign-in page.`;
  }

  return `This email is registered as a ${actual} account, not a ${expected} account. Please use the correct sign-in page.`;
};

export const parseAuthError = (error: unknown): AuthErrorInfo => {
  const defaultError: AuthErrorInfo = {
    message: 'An unexpected error occurred. Please try again.',
  };

  if (!(error instanceof Error)) {
    return defaultError;
  }

  const message = getFriendlyFirebaseError(error);
  const normalized = message.toLowerCase();
  const result: AuthErrorInfo = { message };

  if (normalized.includes('listener account') || normalized.includes('listener sign-in')) {
    result.redirectTo = roleSignInPaths.USER;
    result.redirectLabel = 'Listener Sign In';
  } else if (normalized.includes('artist account')) {
    result.redirectTo = roleSignInPaths.ARTIST;
    result.redirectLabel = 'Artist Sign In';
  } else if (normalized.includes('reseller account')) {
    result.redirectTo = roleSignInPaths.RESELLER;
    result.redirectLabel = 'Reseller Sign In';
  } else if (normalized.includes('producer account')) {
    result.redirectTo = roleSignInPaths.PRODUCER;
    result.redirectLabel = 'Producer Sign In';
  }

  return result;
};