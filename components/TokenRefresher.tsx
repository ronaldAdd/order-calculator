// components/TokenRefresher.js
import { useEffect } from 'react';
import { getAuth, onIdTokenChanged } from 'firebase/auth';
import { app } from '../lib/firebase'; // Firebase App sudah diinisialisasi

export default function TokenRefresher() {
  useEffect(() => {
    const auth = getAuth(app);

    // Dengarkan perubahan token (login/logout atau refresh otomatis Firebase)
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      if (user) {
        // Ambil token dan token result untuk custom claims
        const token = await user.getIdToken();
        const idTokenResult = await user.getIdTokenResult();

        // Ambil role dari custom claims (fallback ke 'user' jika tidak ada)
        const role = idTokenResult.claims.role || 'user';
        const permissions = idTokenResult.claims.permissions || [];

        // Simpan token dan role di cookie
        document.cookie = `__session=${token}; path=/; max-age=3600; Secure; SameSite=Lax`;
        document.cookie = `__role=${role}; path=/; max-age=3600; Secure; SameSite=Lax`;
        document.cookie = `__permissions=${encodeURIComponent(JSON.stringify(permissions))}; path=/; max-age=86400; Secure; SameSite=Strict`;
      } else {
        // Hapus cookie saat logout
        document.cookie = `__session=; path=/; max-age=0; Secure; SameSite=Lax`;
        document.cookie = `__role=; path=/; max-age=0; Secure; SameSite=Lax`;
      }
    });

    // Paksa refresh token tiap 10 menit
    const interval = setInterval(async () => {
      const user = auth.currentUser;
      if (user) {
        const token = await user.getIdToken(true); // force refresh
        const idTokenResult = await user.getIdTokenResult();

        const role = idTokenResult.claims.role || 'user';

        document.cookie = `__session=${token}; path=/; max-age=3600; Secure; SameSite=Strict`;
        document.cookie = `__role=${role}; path=/; max-age=3600; Secure; SameSite=Strict`;
      }
    }, 10 * 60 * 1000); // 10 menit

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  return null; // Tidak perlu render apa-apa
}
