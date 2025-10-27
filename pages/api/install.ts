import type { NextApiRequest, NextApiResponse } from 'next';
import sequelize from '@/lib/db';
import { getAdmin } from '@/lib/firebaseAdmins';
import User from '@/models/user-ts';
import { rolePermissions } from '@/lib/roles';
import initModels from '@/lib/init-models';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { name, email, password } = req.body;
  if (!email || !password || !name)
    return res.status(400).json({ error: 'Name, email, and password are required.' });

  try {
    await sequelize.authenticate();
    initModels(); // ⬅️ WAJIB
    await sequelize.sync(); // ⬅️ Semua model sekarang akan di-sync (Users, Debtors, dll)

    const existing = await User.findOne({ where: { role: 'admin' } });
    if (existing) return res.status(400).json({ error: 'Admin already exists.' });

    const admin = getAdmin();
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name,
    });

    const uid = userRecord.uid;

    await admin.auth().setCustomUserClaims(uid, {
      role: 'admin',
      permissions: rolePermissions['admin'],
    });

    await User.create({
      id: uid,
      name,
      email,
      role: 'admin',
      avatar: null,
      bio: 'Super Admin',
      phoneNumber: null,
      disabled: false,
      createdBy: null,
    });

    res.status(201).json({
      message: '✅ Install success, admin created.',
      user: { uid, email, role: 'admin' },
    });
  } catch (err: unknown) {
      const error = err as Error;
      console.error('[INSTALL ERROR]', error);
      res.status(500).json({ error: error.message || 'Install failed.' });
    }
}
