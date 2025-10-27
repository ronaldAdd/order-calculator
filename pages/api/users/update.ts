import type { NextApiRequest, NextApiResponse } from 'next';
import User from '@/models/user-ts';
import sequelize from '@/lib/db';
import { rolePermissions, type Role } from '@/lib/roles';
import withAuthAPI from '@/lib/withAuthAPI';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method Not Allowed, use PUT' });
  }

  const { id, name, email, role, avatar, phoneNumber, bio, disabled } = req.body;

  if (!id || !email || !role) {
    return res.status(400).json({ error: 'id, email, and role are required.' });
  }

  if (!Object.keys(rolePermissions).includes(role)) {
    return res.status(400).json({ error: `Invalid role: ${role}` });
  }

  const typedRole = role as Role;

  try {
    await sequelize.authenticate();

    // Cari user di MySQL berdasarkan id
    const existingUser = await User.findByPk(id);
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Cek apakah ada user lain dengan email yang sama (exclude current user)
    const emailOwner = await User.findOne({ where: { email } });
    if (emailOwner && emailOwner.id !== id) {
      return res.status(409).json({ error: 'Email already used by another user.' });
    }

    // Update field yang diizinkan
    existingUser.name = name ?? existingUser.name;
    existingUser.email = email;
    existingUser.role = typedRole;
    existingUser.avatar = avatar ?? existingUser.avatar;
    existingUser.phoneNumber = phoneNumber ?? existingUser.phoneNumber;
    existingUser.bio = bio ?? existingUser.bio;

    // Update disabled jika diberikan
    if (typeof disabled === 'boolean') {
      existingUser.disabled = disabled;
    }

    await existingUser.save();

    return res.status(200).json({
      message: 'User updated in MySQL successfully',
      user: existingUser,
    });
  } catch (error: unknown) {
    console.error('❌ Update User API error:', error);

    if (error instanceof Error) {
      return res.status(500).json({ error: error.message });
    }
    
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withAuthAPI(handler);
