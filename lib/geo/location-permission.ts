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
  const host =
    typeof window !== 'undefined' ? window.location.host : 'this website';

  if (!isIOSDevice()) {
    return (
      `Location is blocked for ${host}. Allow location in your browser site settings, then tap Try GPS Again.`
    );
  }

  if (isStandalonePwa()) {
    return (
      `Location blocked for Cherry Pickup (not Safari). Settings → Cherry Pickup → Location → While Using the App. Then tap Try GPS Again and Allow. Site: ${host}`
    );
  }

  return (
    `Safari Location in Settings is only step 1. For ${host}: tap aA in the address bar → Website Settings → Location → Allow, then Try GPS Again. If you chose Don't Allow earlier, the prompt will not return until you change Website Settings.`
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
