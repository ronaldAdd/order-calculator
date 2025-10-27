// pages/api/debtors/kpis/index.ts
import type { NextApiResponse } from 'next'
import type { AuthenticatedRequest } from '@/lib/withAuthAPI'
import withAuthAPI from '@/lib/withAuthAPI'
import sequelize from '@/lib/db'
import Debtor from '@/models/debtor-ts'
import { Op } from 'sequelize'

// ✅ Define proper result types to avoid 'any'
type TotalOutstandingResult = { totalOutstanding: string | number | null }
type CollectedResult = { collected: string | number | null }
type RecoveryResult = { totalPaid: string | number | null; principal: string | number | null }

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    await sequelize.authenticate()

    const where: Record<string, unknown> = {}
    if (req.user?.role === 'collector') {
      where.assignedCollector = req.user.uid
    }

    const totalOutstandingResult = await Debtor.findOne({
      attributes: [[sequelize.fn('SUM', sequelize.col('outstandingAmount')), 'totalOutstanding']],
      where,
      raw: true,
    }) as TotalOutstandingResult | null

    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)

    const collectedResult = await Debtor.findOne({
      attributes: [[sequelize.fn('SUM', sequelize.col('lastPaymentAmount')), 'collected']],
      where: {
        ...where,
        lastPaymentDate: {
          [Op.gte]: firstDay,
          [Op.lte]: now,
        },
      },
      raw: true,
    }) as CollectedResult | null

    const recoveryResult = await Debtor.findOne({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('totalPaid')), 'totalPaid'],
        [sequelize.fn('SUM', sequelize.col('principalAmount')), 'principal'],
      ],
      where,
      raw: true,
    }) as RecoveryResult | null

    const today = new Date().toISOString().slice(0, 10)
    const promisesTodayCount = await Debtor.count({
      where: {
        ...where,
        status: 'Promise to Pay',
        nextFollowUpDate: today,
      },
    })

    const totalOutstanding = parseFloat(String(totalOutstandingResult?.totalOutstanding ?? '0'))
    const collected = parseFloat(String(collectedResult?.collected ?? '0'))
    const totalPaid = parseFloat(String(recoveryResult?.totalPaid ?? '0'))
    const principal = parseFloat(String(recoveryResult?.principal ?? '0'))

    return res.status(200).json({
      totalOutstanding,
      collected,
      recoveryPercentage: principal > 0 ? (totalPaid / principal) * 100 : 0,
      promisesToPayToday: promisesTodayCount,
    })
  } catch (err) {
    console.error('❌ KPI error:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

export default withAuthAPI(handler)
