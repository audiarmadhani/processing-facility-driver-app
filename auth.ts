import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { ensureAuthUrl } from '@/lib/auth-env';

ensureAuthUrl();

type User = {
  id: string | number;
  email: string;
  name: string;
  role: string;
};

const apiUrl =
  process.env.NEXT_PUBLIC_API_URL ??
  'https://processing-facility-backend.onrender.com';

async function loginWithBackend(email: string, password: string): Promise<User | null> {
  const response = await fetch(`${apiUrl}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    cache: 'no-store',
  });

  if (!response.ok) {
    if (process.env.NODE_ENV === 'development') {
      const body = await response.text().catch(() => '');
      console.error('[auth] login failed', response.status, body);
    }
    return null;
  }

  const data = (await response.json()) as { user: User };
  return data.user;
}

const providers = [
  CredentialsProvider({
    id: 'credentials',
    name: 'Credentials',
    credentials: {
      email: { label: 'Email Address', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    authorize: async (credentials) => {
      const email =
        typeof credentials?.email === 'string' ? credentials.email.trim() : '';
      const password =
        typeof credentials?.password === 'string' ? credentials.password : '';

      if (!email || !password) {
        return null;
      }

      try {
        const user = await loginWithBackend(email, password);
        if (!user) return null;

        return {
          id: String(user.id),
          name: user.name,
          email: user.email,
          role: user.role,
        };
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('[auth] login request error', error);
        }
        return null;
      }
    },
  }),
];

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.role = user.role as string;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
    authorized({ auth: session, request: { nextUrl } }) {
      const isLoggedIn = !!session?.user;
      const isPublicPage = nextUrl.pathname.startsWith('/auth');
      if (isPublicPage || isLoggedIn) {
        return true;
      }
      return false;
    },
  },
});
