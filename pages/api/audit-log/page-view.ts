import withAuthAPI from '@/lib/withAuthAPI'
import { logAuditTrail } from '@/lib/logAuditTrail'
import type { NextApiResponse } from 'next'
import type { AuthenticatedRequest } from '@/lib/withAuthAPI'

const handler = async (req: AuthenticatedRequest, res: NextApiResponse): Promise<void> => {
  if (req.method !== 'POST') {
    res.status(405).end()
    return
  }

  const { actorId, actorName, page, description, extra } = req.body

  await logAuditTrail({
    actorId,
    actorName,
    actionType: 'PAGE_VIEW',
    targetEntityType: 'Page',
    targetEntityId: page,
    description,
    details: extra || {},
  })

  res.status(200).json({ success: true })
}

export default withAuthAPI(handler)
