/**
 * License validation and device binding logic
 */

export interface LicenseInfo {
  licenseKey: string;
  mediaId: number;
  deviceId: string;
  userId: number;
  expiresAt?: Date;
  isActive: boolean;
}

export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  deviceType: string;
  os: string;
  fingerprint: string;
}

/**
 * Validates license against backend API
 */
export async function validateLicense(
  mediaId: number,
  licenseKey: string,
  deviceId: string,
  apiBaseUrl: string = '/api'
): Promise<boolean> {
  try {
    const response = await fetch(`${apiBaseUrl}/validate-license?mediaId=${mediaId}&deviceId=${deviceId}&licenseKey=${licenseKey}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return false;
    }

    const result = await response.json();
    return result.valid === true;
  } catch (error) {
    console.error('License validation failed:', error);
    return false;
  }
}

/**
 * Generates device fingerprint for binding
 */
export function generateDeviceFingerprint(): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx?.fillText('fwaya-drm-fingerprint', 10, 10);

  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    !!window.sessionStorage,
    !!window.localStorage,
    !!window.indexedDB,
    canvas.toDataURL(),
  ].join('|');

  // Simple hash for consistency
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return Math.abs(hash).toString(16);
}

/**
 * Gets current device information
 */
export function getDeviceInfo(): DeviceInfo {
  return {
    deviceId: localStorage.getItem('fwaya_device_id') || generateDeviceId(),
    deviceName: getDeviceName(),
    deviceType: getDeviceType(),
    os: getOS(),
    fingerprint: generateDeviceFingerprint(),
  };
}

/**
 * Generates or retrieves persistent device ID
 */
function generateDeviceId(): string {
  let deviceId = localStorage.getItem('fwaya_device_id');
  if (!deviceId) {
    deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('fwaya_device_id', deviceId);
  }
  return deviceId;
}

/**
 * Gets human-readable device name
 */
function getDeviceName(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Mobile')) {
    return 'Mobile Device';
  } else if (ua.includes('Tablet')) {
    return 'Tablet';
  } else {
    return 'Desktop Computer';
  }
}

/**
 * Determines device type
 */
function getDeviceType(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Mobile') || ua.includes('Android') || ua.includes('iPhone')) {
    return 'mobile';
  } else if (ua.includes('Tablet') || ua.includes('iPad')) {
    return 'tablet';
  } else {
    return 'desktop';
  }
}

/**
 * Gets operating system
 */
function getOS(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac')) return 'macOS';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
  return 'Unknown';
}