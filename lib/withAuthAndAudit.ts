// lib/withAuthAndAudit.ts

import type { NextApiResponse } from 'next'
import type { AuthenticatedRequest } from './withAuthAPI'
import withAuthAPI from './withAuthAPI'
import { logAuditTrail } from './logAuditTrail'

// Gunakan ExtendedResponse jika ingin menyimpan data tambahan di response
export type ExtendedResponse = NextApiResponse & {
  locals?: {
    oldData?: Record<string, unknown>
    newData?: Record<string, unknown>
    [key: string]: unknown
  }
}

// Struktur fungsi opsional untuk ekstrak detail audit trail
type Options = {
  getActionType: (req: AuthenticatedRequest, res: ExtendedResponse) => string
  getTargetEntityType: (req: AuthenticatedRequest, res: ExtendedResponse) => string
  getTargetId: (req: AuthenticatedRequest, res: ExtendedResponse) => string
  getDescription: (req: AuthenticatedRequest, res: ExtendedResponse) => string
  getDetails?: (req: AuthenticatedRequest, res: ExtendedResponse) => Record<string, unknown>
}

// Fungsi utama middleware
export default function withAuthAndAudit(
  handler: (req: AuthenticatedRequest, res: ExtendedResponse) =>  Promise<void | NextApiResponse<unknown>>,
  options: Options
) {
  return withAuthAPI(async (req, res: NextApiResponse) => {
    const typedRes = res as ExtendedResponse

    await handler(req, typedRes)

    try {
      const actorId = req.user?.uid ?? 'anonymous'
      const actorName = req.user?.email ?? 'unknown'
      const actionType = options.getActionType(req, typedRes)
      const targetEntityType = options.getTargetEntityType(req, typedRes)
      const targetEntityId = options.getTargetId(req, typedRes)
      const description = options.getDescription(req, typedRes)

      let details: Record<string, unknown> = {}

      if (options.getDetails) {
        details = options.getDetails(req, typedRes)
      } else if (typedRes.locals?.oldData && typedRes.locals?.newData) {
        const oldData = typedRes.locals.oldData
        const newData = typedRes.locals.newData

        const changedFields = Object.keys(newData)
          .filter((key) => oldData[key] !== newData[key])
          .map((key) => ({
            field: key,
            oldValue: oldData[key],
            newValue: newData[key],
          }))

        details = { changedFields }
      }

      await logAuditTrail({
        actorId,
        actorName,
        actionType,
        targetEntityType,
        targetEntityId,
        description,
        details,
      })
    } catch (err) {
      console.error('❌ Failed to log audit trail:', err)
    }
  })
}
