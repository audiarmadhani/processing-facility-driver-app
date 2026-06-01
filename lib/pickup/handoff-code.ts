/** Excludes ambiguous characters: 0, O, 1, I, L */
const HANDOFF_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function generateHandoffCode(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(
    bytes,
    (b) => HANDOFF_ALPHABET[b % HANDOFF_ALPHABET.length]
  ).join('');
}

export function normalizeHandoffCode(input: string): string {
  return input.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6);
}

export function isValidHandoffCode(code: string): boolean {
  return /^[A-Z2-9]{6}$/.test(code) && !/[01ILO]/.test(code);
}
