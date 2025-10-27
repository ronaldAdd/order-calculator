// ./pages/signin.tsx

import Head from 'next/head';
import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import useUserStore from '../src/store/useUserStore';
import Link from 'next/link';
import Image from 'next/image';

interface CustomClaims {
  role?: string;
  permissions?: string[];
}

interface ApiUser {
  id: string;
  name?: string;
  email?: string;
  avatar?: string;
  phoneNumber?: string;
  bio?: string;
  role?: string;
  [key: string]: unknown;
}

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const setUser = useUserStore((state) => state.setUser);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      const idTokenResult = await firebaseUser.getIdTokenResult(true);
      const claims = idTokenResult.claims as CustomClaims;

      const role = claims.role || 'user';
      const permissions = claims.permissions || [];
      const token = idTokenResult.token;

      document.cookie = `__session=${token}; path=/; max-age=86400; Secure; SameSite=Strict`;
      document.cookie = `__role=${role}; path=/; max-age=86400; Secure; SameSite=Strict`;
      document.cookie = `__permissions=${encodeURIComponent(JSON.stringify(permissions))}; path=/; max-age=86400; Secure; SameSite=Strict`;

      const res = await fetch(`/api/users/${firebaseUser.uid}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to fetch user');
      }

      const { user: apiUser }: { user: ApiUser } = await res.json();

      setUser({
        uid: firebaseUser.uid,
        email: apiUser.email || '',
        name: apiUser.name || '',
        avatar: apiUser.avatar || '',
        phoneNumber: apiUser.phoneNumber || '',
        token,
        role,
        permissions,
      });

      switch (role) {
        case 'admin':
          window.location.href = '/admin';
          break;
        case 'collector':
          window.location.href = '/collector';
          break;
        default:
          window.location.href = '/';
      }
    } catch (err) {
      console.error(err);
      setError('Incorrect email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Sign In - InfinityAI</title>
      </Head>

      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f172a] to-[#1e293b] px-4">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow-md p-8 max-w-md w-full"
        >

          {/* ✅ Logo */}
          <div className="flex justify-center mb-4">
            <Image  src="/logo.jpg" alt="MyApp Logo" width={300} height={50} />
          </div>

          <h1 className="text-3xl font-bold mb-6 text-center text-[#0f172a]">
            {/* Sign in to MyApp */}
          </h1>

          <div className="mb-4">
            <label htmlFor="email" className="block font-medium mb-1 text-[#0f172a]">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="name@example.com"
              disabled={loading}
            />
          </div>

          <div className="mb-4">
            <label htmlFor="password" className="block font-medium mb-1 text-[#0f172a]">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="********"
              disabled={loading}
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm mb-4 font-semibold">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <div className="mt-6 flex justify-between text-sm text-[#0f172a]">
            <Link href="/forgot-password" className="hover:underline text-blue-600">
              Forgot password?
            </Link>
          </div>
        </form>
      </main>
    </>
  );
}
