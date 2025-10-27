// pages/api/debtors/aging.ts
import type { NextApiResponse } from 'next'
import sequelize from '@/lib/db'
import { QueryTypes } from 'sequelize'
import withAuthAPI from '@/lib/withAuthAPI'
import type { AuthenticatedRequest } from '@/lib/withAuthAPI'

type AgingResult = {
  label: string
  amount: number
}

export default withAuthAPI(async (req: AuthenticatedRequest, res: NextApiResponse) => {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const uid = req.user?.uid
    const role = req.user?.role

    const cases = [
      {
        label: '0-30',
        condition: 'DATEDIFF(CURDATE(), createdAt) BETWEEN 0 AND 30',
      },
      {
        label: '31-60',
        condition: 'DATEDIFF(CURDATE(), createdAt) BETWEEN 31 AND 60',
      },
      {
        label: '61-90',
        condition: 'DATEDIFF(CURDATE(), createdAt) BETWEEN 61 AND 90',
      },
      {
        label: '90+',
        condition: 'DATEDIFF(CURDATE(), createdAt) > 90',
      },
    ]

    const results: AgingResult[] = []

    for (const aging of cases) {
      const where = `WHERE ${aging.condition} AND outstandingAmount > 0`

      // Tambahkan filter collector jika role-nya 'collector'
      const collectorFilter =
        role === 'collector' ? ` AND assignedCollector = :uid` : ''

      const query = `
        SELECT SUM(outstandingAmount) AS total
        FROM debtors
        ${where}${collectorFilter}
      `

      const [result] = await sequelize.query(query, {
        type: QueryTypes.SELECT,
        replacements: role === 'collector' ? { uid } : {},
      })

      const total = typeof result === 'object' && result !== null
        ? Number((result as Record<string, unknown>).total ?? 0)
        : 0

      results.push({
        label: aging.label,
        amount: total,
      })
    }

    return res.status(200).json({ success: true, data: results })
  } catch (err) {
    console.error('❌ Error fetching aging data:', err)
    return res.status(500).json({ success: false, message: 'Internal Server Error' })
  }
})
