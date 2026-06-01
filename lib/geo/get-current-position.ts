export interface GeoPosition {
  latitude: number;
  longitude: number;
  accuracy?: number;
  /** True if coordinates came from a cached fix (not a fresh GPS lock). */
  cached?: boolean;
}

import { GeoLocationError, type GeoFailureReason } from '@/lib/geo/errors';
import {
  assertGeolocationAllowed,
  isSecureContextForGeo,
  locationDeniedHelpText,
} from '@/lib/geo/location-permission';

export { GeoLocationError, type GeoFailureReason };

function toPosition(
  pos: GeolocationPosition,
  cached: boolean
): GeoPosition {
  return {
    latitude: pos.coords.latitude,
    longitude: pos.coords.longitude,
    accuracy: pos.coords.accuracy,
    cached,
  };
}

function getCurrentPositionOnce(
  options: PositionOptions
): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}

function mapGeoError(err: GeolocationPositionError): GeoLocationError {
  switch (err.code) {
    case err.PERMISSION_DENIED:
      return new GeoLocationError('denied', locationDeniedHelpText());
    case err.POSITION_UNAVAILABLE:
      return new GeoLocationError(
        'unavailable',
        'GPS signal not found. Move to an open area away from buildings and try again.'
      );
    case err.TIMEOUT:
      return new GeoLocationError(
        'timeout',
        'GPS timed out. Stay outdoors with a clear view of the sky and tap Try again.'
      );
    default:
      return new GeoLocationError(
        'unavailable',
        err.message || 'Unable to get GPS location.'
      );
  }
}

/**
 * Resolves farm coordinates with progressive fallbacks (field-friendly):
 * 1) Recent cached fix (fast)
 * 2) Network-assisted / low accuracy
 * 3) High-accuracy GPS (longer timeout)
 */
export async function getCurrentPosition(): Promise<GeoPosition> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    throw new GeoLocationError(
      'unsupported',
      'Geolocation is not supported on this device.'
    );
  }

  if (!isSecureContextForGeo()) {
    throw new GeoLocationError(
      'denied',
      'Location requires a secure connection (HTTPS). Open the deployed app link, not an insecure URL.'
    );
  }

  await assertGeolocationAllowed();

  const attempts: Array<{ label: string; options: PositionOptions }> = [
    {
      label: 'cached',
      options: {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 120_000, // up to 2 minutes old
      },
    },
    {
      label: 'low-accuracy',
      options: {
        enableHighAccuracy: false,
        timeout: 25_000,
        maximumAge: 30_000,
      },
    },
    {
      label: 'high-accuracy',
      options: {
        enableHighAccuracy: true,
        timeout: 45_000,
        maximumAge: 0,
      },
    },
  ];

  let lastError: GeoLocationError | null = null;

  for (const attempt of attempts) {
    try {
      const pos = await getCurrentPositionOnce(attempt.options);
      return toPosition(pos, attempt.label === 'cached');
    } catch (err) {
      if (err instanceof GeolocationPositionError) {
        const mapped = mapGeoError(err);
        lastError = mapped;
        // Permission denied won't succeed on retry — stop early
        if (mapped.reason === 'denied') {
          throw mapped;
        }
      } else {
        lastError = new GeoLocationError(
          'unavailable',
          'Unable to get GPS location.'
        );
      }
    }
  }

  throw (
    lastError ??
    new GeoLocationError(
      'timeout',
      'GPS timed out. Stay outdoors with a clear view of the sky and tap Try again.'
    )
  );
}
