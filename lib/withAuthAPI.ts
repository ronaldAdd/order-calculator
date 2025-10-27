import admin from './firebaseAdmin'
import { NextApiRequest, NextApiResponse } from 'next'
import type { DecodedIdToken } from 'firebase-admin/auth'
import User from '@/models/user-ts'
import sequelize from '@/lib/db'

// Tambahan tipe request dengan user + role
export interface AuthenticatedRequest extends NextApiRequest {
  user?: DecodedIdToken & { role?: string }
}

// Fungsi parsing cookie manual
function parseCookies(req: NextApiRequest): Record<string, string> {
  const list: Record<string, string> = {}
  const cookieHeader = req.headers?.cookie
  if (!cookieHeader) return list

  cookieHeader.split(';').forEach((cookie) => {
    const [name, ...rest] = cookie.trim().split('=')
    if (!name || !rest) return
    list[name] = decodeURIComponent(rest.join('='))
  })

  return list
}

// Middleware
export default function withAuthAPI(
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>
): (req: NextApiRequest, res: NextApiResponse) => Promise<void> {
  return async (req, res) => {
    const cookies = parseCookies(req)
    const token = cookies.__session

    if (!token) {
      return res.status(401).json({ message: 'No token found in cookies.' })
    }

    try {
      const decodedToken = await admin.auth().verifyIdToken(token)
      const uid = decodedToken.uid

      await sequelize.authenticate()
      const userRecord = await User.findOne({ where: { id: uid } })

      if (!userRecord) {
        return res.status(403).json({ message: 'User not found in database.' })
      }

      ;(req as AuthenticatedRequest).user = {
        ...decodedToken,
        role: userRecord.role || 'Guest',
      }

      return handler(req as AuthenticatedRequest, res)
    } catch (error) {
      console.error('❌ Auth Error:', error)
      return res.status(401).json({ message: 'Invalid or expired token.' })
    }
  }
}
