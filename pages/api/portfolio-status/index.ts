// pages/api/portfolio-status/index.ts
import type { NextApiResponse } from 'next'
import type { AuthenticatedRequest } from '@/lib/withAuthAPI'
import withAuthAPI from '@/lib/withAuthAPI'
import Debtor from '@/models/debtor-ts'
import { fn, col } from 'sequelize'

const STATUS_OPTIONS = ['New', 'Contacted', 'Promise to Pay', 'Paid', 'Inactive']

export default withAuthAPI(async (req: AuthenticatedRequest, res: NextApiResponse) => {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const { productName } = req.query

    const where: Record<string, unknown> = {}
    if (productName && typeof productName === 'string') {
      where.productName = productName
    }
    if (req.user?.role === 'collector') {
      where.assignedCollector = req.user.uid
    }

    const results = await Debtor.findAll({
      attributes: ['status', [fn('COUNT', col('status')), 'count']],
      where,
      group: ['status'],
      raw: true,
    })

    const statusMap: Record<string, number> = {}
    STATUS_OPTIONS.forEach((status) => {
      statusMap[status] = 0
    })

    results.forEach((row) => {
      const status = row.status as string
      const count = Number((row as { count?: string | number }).count ?? 0)
      if (status && statusMap.hasOwnProperty(status)) {
        statusMap[status] = count
      }
    })

    return res.status(200).json({
      labels: STATUS_OPTIONS,
      values: STATUS_OPTIONS.map((status) => statusMap[status]),
    })
  } catch (err) {
    console.error('❌ Error fetching portfolio status:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
})
