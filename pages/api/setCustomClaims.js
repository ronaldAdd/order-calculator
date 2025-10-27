import { rolePermissions } from '../../lib/roles';
import withAuthAPI from '@/lib/withAuthAPI';


async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  const { uid, role } = req.body;

  if (!uid || !role) {
    return res.status(400).json({ error: 'UID and role are required' });
  }

  // Dapatkan permissions dari rolePermissions
  const permissions = rolePermissions[role];

  if (!permissions) {
    return res.status(400).json({ error: `Role '${role}' is invalid or has no permissions.` });
  }

  try {
    // Import admin SDK dinamis
    const { getAdmin } = await import('../../lib/firebaseAdmins');
    const admin = getAdmin();

    // Set custom claims
    await admin.auth().setCustomUserClaims(uid, {
      role,
      permissions,
    });

    return res.status(200).json({
      message: `Role '${role}' and permissions set for UID ${uid}`,
      claims: { role, permissions },
    });
  } catch (error) {
    console.error('🔥 setCustomClaims error:', error);
    return res.status(500).json({ error: error.message });
  }
}

export default withAuthAPI(handler);