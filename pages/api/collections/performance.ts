// pages/api/collections/performance.ts
import type { NextApiResponse } from 'next'
import { Op, fn, col, WhereOptions } from 'sequelize'
import Debtor from '@/models/debtor-ts'
import withAuthAPI from '@/lib/withAuthAPI'
import type { AuthenticatedRequest } from '@/lib/withAuthAPI'

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const now = new Date()
    const year = now.getFullYear()

    const where: WhereOptions = {
      lastPaymentDate: {
        [Op.gte]: new Date(`${year}-01-01`),
        [Op.lte]: new Date(`${year}-12-31`),
      },
    }

    if (req.user?.role === 'collector') {
      where['assignedCollector'] = req.user.uid
    }

    const payments = await Debtor.findAll({
      attributes: [
        [fn('MONTH', col('lastPaymentDate')), 'month'],
        [fn('SUM', col('lastPaymentAmount')), 'total'],
      ],
      where,
      group: [fn('MONTH', col('lastPaymentDate'))],
      order: [[fn('MONTH', col('lastPaymentDate')), 'ASC']],
      raw: true,
    }) as unknown as { month: number; total: string | number | null }[]

    const actual: number[] = Array(12).fill(0)
    for (const row of payments) {
      const monthIndex = Number(row.month) - 1
      actual[monthIndex] = parseFloat(String(row.total ?? '0'))
    }

    const target = Array(12).fill(100_000_000)

    return res.status(200).json({
      labels: [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      ],
      target,
      actual,
    })
  } catch (err) {
    console.error('❌ Error in /api/collections/performance:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

export default withAuthAPI(handler)
