'use server';
import { AuthError } from 'next-auth';
import type { AuthProvider } from '@toolpad/core';
import { signIn as signInAction } from '@/auth';
import { safeCallbackPath } from '@/lib/auth-env';

function readCredential(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

async function signIn(provider: AuthProvider, formData: FormData, callbackUrl?: string) {
  try {
    const email = readCredential(formData, 'email');
    const password = readCredential(formData, 'password');

    if (!email || !password) {
      return {
        error: 'Email and password are required.',
        type: 'CredentialsSignin',
      };
    }

    return await signInAction(provider.id, {
      email,
      password,
      redirectTo: safeCallbackPath(callbackUrl),
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error;
    }
    if (error instanceof AuthError) {
      return {
        error:
          error.type === 'CredentialsSignin'
            ? 'Invalid credentials.'
            : 'An error with Auth.js occurred.',
        type: error.type,
      };
    }
    return {
      error: 'Something went wrong.',
      type: 'UnknownError',
    };
  }
}

export default signIn;
