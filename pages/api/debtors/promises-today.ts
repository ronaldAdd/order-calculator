import type { AuthenticatedRequest } from '@/lib/withAuthAPI'
import type { ExtendedResponse } from '@/lib/withAuthAndAudit'
import withAuthAndAudit from '@/lib/withAuthAndAudit'

import sequelize from '@/lib/db'
import Debtor from '@/models/debtor-ts'
import User from '@/models/user-ts'
import { initAssociations } from '@/models/associations'
import { Op } from 'sequelize'

initAssociations()

async function handler(req: AuthenticatedRequest, res: ExtendedResponse) {
  try {
    await sequelize.authenticate()

    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const endOfDay = new Date(today)
    endOfDay.setHours(23, 59, 59, 999)

    const where: Record<string, unknown> = {
      status: 'Promise to Pay',
      nextFollowUpDate: {
        [Op.gte]: today,
        [Op.lte]: endOfDay,
      },
    }

    if (req.user?.role === 'collector') {
      where.assignedCollector = req.user.uid
    }

    const data = await Debtor.findAll({
      where,
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email', 'role'],
        },
      ],
    })

    return res.status(200).json({ data })
  } catch (error) {
    const err = error as Error
    console.error('❌ Error fetching promises to pay today:', err)

    return res.status(500).json({
      error: 'Internal Server Error',
      message: err?.message || 'Unknown error',
    })
  }
}

export default withAuthAndAudit(handler, {
  getActionType: () => 'DEBTOR_GET_PROMISES_TODAY',
  getTargetEntityType: () => 'Debtor',
  getTargetId: () => 'PromiseToPayToday',
  getDescription: () => 'Fetched all debtors with Promise to Pay today',
  getDetails: ({ method, query }) => ({ method, query }),
})

