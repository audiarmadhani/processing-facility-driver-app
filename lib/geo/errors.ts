export type GeoFailureReason = 'unsupported' | 'denied' | 'unavailable' | 'timeout';

export class GeoLocationError extends Error {
  readonly reason: GeoFailureReason;

  constructor(reason: GeoFailureReason, message: string) {
    super(message);
    this.name = 'GeoLocationError';
    this.reason = reason;
  }
}
