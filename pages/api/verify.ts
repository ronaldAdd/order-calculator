// pages/api/verify.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Hanya izinkan POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.body;
  const secret = process.env.RECAPTCHA_SECRET;

  // Pastikan secret & token ada
  if (!secret) {
    return res.status(500).json({ error: 'RECAPTCHA_SECRET belum diatur di .env.local' });
  }
  if (!token) {
    return res.status(400).json({ error: 'Token tidak ditemukan' });
  }

  try {
    // Siapkan data untuk dikirim ke Google
    const params = new URLSearchParams();
    params.append('secret', secret);
    params.append('response', token);

    // Kirim ke Google reCAPTCHA endpoint
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      body: params,
    });

    const data = await response.json();

    console.log(params,'PRAMS');
    
    // Log hasil untuk debugging
    console.log('Hasil verifikasi reCAPTCHA:', data);

    // Kirim balik ke frontend
    return res.status(200).json({
      success: data.success,
      score: data.score,
      action: data.action,
      hostname: data.hostname,
      challenge_ts: data.challenge_ts,
      message: data.success
        ? `Verifikasi berhasil (score: ${data.score})`
        : 'Verifikasi gagal atau token tidak valid',
    });
  } catch (err: any) {
    console.error('Error verifikasi reCAPTCHA:', err);
    return res.status(500).json({ error: 'Gagal memverifikasi reCAPTCHA', details: err.message });
  }
}
