import { GeoLocationError } from '@/lib/geo/errors';

export function isIOSDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return (
    /iPad|iPhone|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

export function isStandalonePwa(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function locationDeniedHelpText(): string {
  if (!isIOSDevice()) {
    return (
      'Location is blocked for this site. Allow location in your browser site settings, then tap Try GPS Again.'
    );
  }

  if (isStandalonePwa()) {
    return (
      'This app does not have location access yet. Open Settings → Cherry Pickup → Location → "While Using the App" (not only Safari). Under Privacy & Security → Location Services, turn Location ON. Then return here and tap Try GPS Again — tap Allow if iPhone asks.'
    );
  }

  return (
    'Safari’s global Location setting does not auto-allow this site. Tap Try GPS Again and choose Allow if asked. If you tapped Don’t Allow before: open this page in Safari → tap the aA icon in the address bar → Website Settings → Location → Allow. Or Settings → Apps → Safari → Location (must be While Using). Installed app: Settings → Cherry Pickup → Location.'
  );
}

/**
 * Desktop browsers expose a reliable denied state; iOS Safari does not — always
 * call getCurrentPosition and handle PERMISSION_DENIED there instead.
 */
export async function assertGeolocationAllowed(): Promise<void> {
  if (isIOSDevice()) {
    return;
  }

  if (typeof navigator === 'undefined' || !navigator.permissions?.query) {
    return;
  }

  try {
    const status = await navigator.permissions.query({
      name: 'geolocation' as PermissionName,
    });

    if (status.state === 'denied') {
      throw new GeoLocationError('denied', locationDeniedHelpText());
    }
  } catch (error) {
    if (error instanceof GeoLocationError) {
      throw error;
    }
  }
}

export function isSecureContextForGeo(): boolean {
  if (typeof window === 'undefined') return true;
  return window.isSecureContext;
}
