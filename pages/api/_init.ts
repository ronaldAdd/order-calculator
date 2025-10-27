// pages/api/_init.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import sequelize from '@/lib/db'
import initModels from '@/lib/init-models'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    initModels() // ✅ Load semua model
    await sequelize.sync({ alter: true }) // ⛏️ Otomatis buat/ubah tabel

    const [tables] = await sequelize.query("SHOW TABLES") as [Record<string, string>[], unknown];

    return res.status(200).json({
      message: '✅ DB initialized',
      tables: tables.map((row) => Object.values(row)[0]),
    });
  } catch (err) {
    const error = err as Error;
    console.error('[AUTO-SYNC ERROR]', error);
    return res.status(500).json({ error: error.message });
  }
}
