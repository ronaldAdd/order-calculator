import { IncomingForm, Files, File } from 'formidable';
import fs from 'fs';
import os from 'os';
import * as XLSX from 'xlsx';
import withAuthAPI from '@/lib/withAuthAPI';
import type { NextApiRequest, NextApiResponse } from 'next';
import { pusher } from '@/lib/pusherServer'; // Import Pusher

export const config = {
  api: {
    bodyParser: false,
  },
};

interface AuthenticatedRequest extends NextApiRequest {
  user?: {
    uid: string;
    email?: string;
    role?: string;
    [key: string]: unknown;
  };
}

// 🔄 Kirim progress ke Pusher
async function sendProgressToPusher(uid: string, progress: number) {
  await pusher.trigger(`progress-${uid}`, 'progress-update', {
    progress,
  });
}

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const form = new IncomingForm({
    uploadDir: os.tmpdir(), // ✅ gunakan tmp dir cross-platform
    keepExtensions: true,
  });

  form.parse(req, async (err, fields, files: Files) => {
    if (err) {
      return res.status(500).json({ message: 'Upload error', error: err.message });
    }

    try {
      const file = files.file;
      if (!file) return res.status(400).json({ message: 'No file uploaded' });

      const fileData = Array.isArray(file) ? file[0] : file;
      const filePath = (fileData as File).filepath;

      // ✅ Baca Excel dan ambil data dengan format asli (tanpa raw value)
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rawData: (string | number | boolean | null)[][] = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        raw: false, // ✅ penting agar format seperti tanggal tidak dikonversi jadi angka
      });

      const uid = req.user?.uid || 'unknown';
      const total = rawData.length;
      const batchSize = Math.ceil(total / 20); // update setiap 5%

      const parsedData: (string | number | boolean | null)[][] = [];

      for (let i = 0; i < total; i++) {
        parsedData.push(rawData[i]);

        if (i % batchSize === 0 || i === total - 1) {
          const progress = Math.floor((i / total) * 100);
          await sendProgressToPusher(uid, progress);
        }
      }

      // ⏹ Hapus file sementara
      fs.unlinkSync(filePath);

      // ✅ Kirim response
      res.status(200).json({
        message: 'File processed successfully',
        totalRows: parsedData.length,
        data: parsedData,
      });
    } catch (error) {
      const err = error as Error;
      res.status(500).json({ message: 'Failed to process file', error: err.message });
    }
  });
}

export default withAuthAPI(handler);
