import type { NextApiRequest, NextApiResponse } from 'next';
import { rolePermissions, type Role } from '@/lib/roles';
import { getAdmin } from '@/lib/firebaseAdmins';
import User from '@/models/user-ts'; // Sequelize model
import sequelize from '@/lib/db';
import withAuthAPIAdmin from '@/lib/withAuthAPIAdmin';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }

  const { email, password, displayName, role, avatar } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ error: 'Email, password, and role are required' });
  }

  if (!Object.keys(rolePermissions).includes(role)) {
    return res.status(400).json({ error: `Invalid role: ${role}` });
  }

  const typedRole = role as Role;
  const permissions = rolePermissions[typedRole];

  try {
    await sequelize.authenticate(); // Pastikan koneksi MySQL aktif
    const admin = getAdmin();

    // Cek apakah user dengan email ini sudah ada di MySQL
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists in MySQL.' });
    }

    // Buat user di Firebase
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName,
    });

    const uid = userRecord.uid;

    // Set custom claims
    await admin.auth().setCustomUserClaims(uid, {
      role: typedRole,
      permissions,
    });

    // Simpan ke Firestore
    const userDoc = {
      uid,
      email,
      name: displayName || '',
      role: typedRole,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // await admin.firestore().collection('users').doc(uid).set(userDoc);

    // Simpan ke MySQL
    const newUser = await User.create({
      id: uid,
      name: displayName ?? null,
      email,
      role: typedRole,
      avatar: avatar ?? null,
    });

    return res.status(201).json({
      message: 'User created, saved to Firestore and MySQL',
      user: {
        firestore: userDoc,
        mysql: newUser,
      },
    });

  } catch (error: unknown) {
    console.error('🔥 createUser error:', error);

    if (error instanceof Error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withAuthAPIAdmin(handler);
