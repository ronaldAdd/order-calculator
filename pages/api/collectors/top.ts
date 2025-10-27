// pages/api/collectors/top.ts
import type { NextApiResponse } from 'next'
import type { AuthenticatedRequest } from '@/lib/withAuthAPI'
import withAuthAPI from '@/lib/withAuthAPI'
import { Op, fn, col } from 'sequelize'
import Debtor from '@/models/debtor-ts'
import User from '@/models/user-ts'
import { initAssociations } from '@/models/associations'

initAssociations()

interface TopCollectorRow extends Debtor {
  getDataValue(
    key: 'totalCollected' | 'totalDebtors' | keyof typeof Debtor.prototype
  ): string | number | null
  User?: {
    id: string
    name: string
    email: string
  }
}

const handler = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ success: false, message: 'Method not allowed' })
    }

    const results = await Debtor.findAll({
      attributes: [
        'assignedCollector',
        [fn('SUM', col('totalPaid')), 'totalCollected'],
        [fn('COUNT', col('Debtor.id')), 'totalDebtors'],
      ],
      where: {
        assignedCollector: {
          [Op.ne]: null,
        },
      },
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email'],
        },
      ],
      group: ['assignedCollector', 'User.id'],
      order: [[fn('SUM', col('totalPaid')), 'DESC']],
      raw: false,
    })

    const formatted = (results as TopCollectorRow[]).map((row) => {
      const totalCollected = row.getDataValue('totalCollected')
      const totalDebtors = row.getDataValue('totalDebtors')
      const collectorId = row.getDataValue('assignedCollector')

      return {
        collectorId: typeof collectorId === 'string' ? collectorId : '',
        name: row.User?.name || '',
        email: row.User?.email || '',
        totalCollected: parseFloat(totalCollected as string) || 0,
        totalDebtors: parseInt(totalDebtors as string) || 0,
      }
    })

    return res.status(200).json({ success: true, data: formatted })
  } catch (err) {
    console.error('❌ Error fetching top collectors:', err)
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

export default withAuthAPI(handler)
