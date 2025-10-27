// pages/api/collections/daily.ts
import type { NextApiResponse } from 'next'
import { Op, fn, col, WhereOptions } from 'sequelize'
import withAuthAPI from '@/lib/withAuthAPI'
import type { AuthenticatedRequest } from '@/lib/withAuthAPI'
import Debtor from '@/models/debtor-ts'

export default withAuthAPI(async (req: AuthenticatedRequest, res: NextApiResponse) => {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    const where: WhereOptions = {
      lastPaymentDate: {
        [Op.gte]: startOfMonth,
        [Op.lte]: endOfMonth,
      },
    }

    if (req.user?.role === 'collector') {
      where.assignedCollector = req.user.uid
    }

    const results = await Debtor.findAll({
      attributes: [
        [fn('DATE', col('lastPaymentDate')), 'date'],
        [fn('SUM', col('lastPaymentAmount')), 'amount'],
      ],
      where,
      group: [fn('DATE', col('lastPaymentDate'))],
      order: [[fn('DATE', col('lastPaymentDate')), 'ASC']],
      raw: true,
    })

    res.status(200).json(results)
  } catch (err) {
    console.error('❌ Error fetching collection data:', err)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})
