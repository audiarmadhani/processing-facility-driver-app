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
      'Location is blocked. Allow location for this website in your browser settings, then tap Try GPS Again.'
    );
  }

  if (isStandalonePwa()) {
    return (
      'Location is blocked on iPhone. Open Settings → scroll to Cherry Pickup (or Safari) → Location → choose "While Using the App" or "Ask Next Time". Also check Settings → Privacy & Security → Location Services is ON. Then return here and tap Try GPS Again.'
    );
  }

  return (
    'Location is blocked on iPhone. When you tap Try GPS Again, choose Allow if asked. If you previously tapped Don\'t Allow: Settings → Apps → Safari → Location → Allow. Also enable Settings → Privacy & Security → Location Services. For the installed app: Settings → Cherry Pickup → Location.'
  );
}

/** Query permission state when supported (avoids silent failures on iOS). */
export async function assertGeolocationAllowed(): Promise<void> {
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
    // Permissions API may be unsupported; getCurrentPosition will still prompt.
  }
}

export function isSecureContextForGeo(): boolean {
  if (typeof window === 'undefined') return true;
  return window.isSecureContext;
}
