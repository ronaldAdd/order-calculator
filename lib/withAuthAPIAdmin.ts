// lib/withAuthAPI.ts
import admin from './firebaseAdmin';
import { NextApiRequest, NextApiResponse } from 'next';
import type { DecodedIdToken } from 'firebase-admin/auth';

// Extend NextApiRequest untuk menyertakan user
interface AuthenticatedRequest extends NextApiRequest {
  user?: DecodedIdToken;
}

// Parse cookies secara aman
function parseCookies(req: NextApiRequest): Record<string, string> {
  const list: Record<string, string> = {};
  const cookieHeader = req.headers?.cookie;
  if (!cookieHeader) return list;

  cookieHeader.split(';').forEach((cookie) => {
    const [name, ...rest] = cookie.trim().split('=');
    if (!name || !rest) return;
    list[name] = decodeURIComponent(rest.join('='));
  });

  return list;
}

// Middleware wrapper untuk API routes
export default function withAuthAPIAdmin(
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => unknown | Promise<unknown>
) {
  return async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const cookies = parseCookies(req);
    const token = cookies.__session;

    if (!token) {
      return res.status(401).json({ message: 'No token found in cookies.' });
    }

    try {
      const decodedToken = await admin.auth().verifyIdToken(token);

      req.user = decodedToken; // Inject user info ke request

      return handler(req, res);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('❌ Token verification failed:', error.message);
        return res.status(401).json({ message: error.message });
      } else {
        console.error('❌ Token verification failed:', error);
        return res.status(401).json({ message: 'Invalid or expired token.' });
      }
    }
  };
}
