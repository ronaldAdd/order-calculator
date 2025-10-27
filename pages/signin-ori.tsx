// pages/signin.tsx

import Head from 'next/head';
import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/router';
import useUserStore from '../src/store/useUserStore';
import Link from 'next/link';

// 🔒 Tambahkan tipe untuk data dari Firestore
interface FirestoreUserData {
  avatar?: string;
  name?: string;
  [key: string]: unknown;
}

// 🔐 Tambahkan tipe untuk custom claims
interface CustomClaims {
  role?: string;
  permissions?: string[];
}

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const setUser = useUserStore((state) => state.setUser);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Refresh token
      await user.getIdToken(true);
      const idTokenResult = await user.getIdTokenResult();

      const claims = idTokenResult.claims as CustomClaims;
      const role = claims.role || 'user';
      const permissions = claims.permissions || [];
      const token = idTokenResult.token || '';

      // Ambil data tambahan dari Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userDocRef);
      const userData: FirestoreUserData = userSnap.exists()
        ? (userSnap.data() as FirestoreUserData)
        : {};

      // Simpan ke Zustand store
      setUser({
        uid: user.uid,
        email: user.email || '',
        token,
        role,
        permissions,
        avatar: userData.avatar || '',
        name: userData.name || '',
      });

      // Simpan cookie sementara
      document.cookie = `__session=${token}; path=/; max-age=86400; Secure; SameSite=Strict`;
      document.cookie = `__role=${role}; path=/; max-age=86400; Secure; SameSite=Strict`;
      document.cookie = `__permissions=${encodeURIComponent(JSON.stringify(permissions))}; path=/; max-age=86400; Secure; SameSite=Strict`;

        console.log(role,'role');
      // Redirect berdasarkan role
      switch (role) {        
        case 'admin':
          router.push('/admin');
          break;
        case 'collector':
          router.push('/collector');
          break;
        default:
          router.push('/');
      }
    } catch (err) {
      console.error(err);
      setError('Email atau password salah.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Masuk - InfinityAI</title>
      </Head>

      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f172a] to-[#1e293b] px-4">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow-md p-8 max-w-md w-full"
        >
          <h1 className="text-3xl font-bold mb-6 text-center text-[#0f172a]">
            Masuk ke InfinityAI
          </h1>

          <div className="mb-4">
            <label htmlFor="email" className="block font-medium mb-1 text-[#0f172a]">
              Alamat Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="nama@contoh.com"
              disabled={loading}
            />
          </div>

          <div className="mb-4">
            <label htmlFor="password" className="block font-medium mb-1 text-[#0f172a]">
              Kata Sandi
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
            {loading ? 'Sedang masuk...' : 'Masuk'}
          </button>

          <div className="mt-6 flex justify-between text-sm text-[#0f172a]">
            <Link href="/forgot-password" className="hover:underline text-blue-600">
              Lupa kata sandi?
            </Link>
            <p>
              Belum punya akun?{' '}
              <Link href="/register" className="hover:underline text-blue-600">
                Daftar di sini
              </Link>
            </p>
          </div>
        </form>
      </main>
    </>
  );
}
