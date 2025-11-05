'use client';

//daftar captcha
import React, { useEffect, useState } from 'react';

// Biar TypeScript gak error
declare global {
  interface Window {
    grecaptcha: any;
  }
}

export default function Formulir() {
  const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '';
  const [nama, setNama] = useState('');
  const [ktp, setKtp] = useState('');
  const [telepon, setTelepon] = useState('');
  const [score, setScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Load reCAPTCHA script saat pertama kali komponen dipasang
  useEffect(() => {
    if (!SITE_KEY) {
      console.warn('NEXT_PUBLIC_RECAPTCHA_SITE_KEY belum diatur di .env.local');
      return;
    }
    const id = 'recaptcha-script';
    if (document.getElementById(id)) return;

    const script = document.createElement('script');
    script.id = id;
    script.src = `https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`;
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  }, [SITE_KEY]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!SITE_KEY) {
      alert('SITE_KEY belum diatur');
      return;
    }

    setLoading(true);
    try {
      // Tunggu grecaptcha siap
      await new Promise<void>((resolve, reject) => {
        const t0 = Date.now();
        (function check() {
          if (window.grecaptcha && window.grecaptcha.execute) return resolve();
          if (Date.now() - t0 > 5000) return reject(new Error('grecaptcha timeout'));
          setTimeout(check, 200);
        })();
      });

      // Dapatkan token dari Google
      const token = await window.grecaptcha.execute(SITE_KEY, { action: 'submit' });

      // Kirim token ke server untuk verifikasi
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();
      console.log('Google verify response:', data);

      setScore(data.score ?? null);
      alert(`Skor dari Google: ${data.score ?? 'Tidak ada'}`);
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4 text-center">Formulir Pendaftaran</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">Nama Lengkap</label>
          <input
            type="text"
            value={nama}
            id='name'
            name='name'
            onChange={(e) => setNama(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            required
          />
        </div>

        <div>
          <label className="block mb-1">Nomor KTP</label>
          <input
            type="text"
            value={ktp}
            id='ktp'
            name='ktp'
            onChange={(e) => setKtp(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            required
          />
        </div>

        <div>
          <label className="block mb-1">Nomor Telepon</label>
          <input
            type="text"
            value={telepon}
            id='phone_number'
            name='phone_number'
            onChange={(e) => setTelepon(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded transition"
        >
          {loading ? 'Memproses...' : 'Kirim'}
        </button>
      </form>

      {score !== null && (
        <div className="mt-4 text-center">
          <p className="font-medium">Skor reCAPTCHA: {score}</p>
        </div>
      )}
    </div>
  );
}
