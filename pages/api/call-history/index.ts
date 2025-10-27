import type { NextApiRequest, NextApiResponse } from 'next'
import { Op, WhereOptions } from 'sequelize'
import CallHistory from '@/models/call-history-ts'
import User from '@/models/user-ts'
import withAuthAPI from '@/lib/withAuthAPI'
import { initAssociations } from '@/models/associations'

initAssociations()

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' })
  }

  try {
    const {
      page = '1',
      limit = '20',
      sortBy = 'timestamp',
      sortOrder = 'DESC',
      collectorId,
      debtorId,
      callOutcome,
      dateStart,
      dateEnd,
    } = req.query

    const where: WhereOptions = {}

    if (collectorId) where.collectorId = collectorId
    if (debtorId) where.debtorId = debtorId
    if (callOutcome) where.callOutcome = callOutcome

    if (dateStart || dateEnd) {
      where.timestamp = {}
      if (dateStart) where.timestamp[Op.gte] = new Date(`${dateStart}T00:00:00`)
      if (dateEnd) where.timestamp[Op.lte] = new Date(`${dateEnd}T23:59:59`)
    }

    const pageNumber = parseInt(page as string, 10)
    const limitNumber = parseInt(limit as string, 10)
    const offset = (pageNumber - 1) * limitNumber

    const validSortBy = ['timestamp', 'collectorId', 'debtorId', 'callOutcome']
    const validSortOrder = ['ASC', 'DESC']

    const finalSortBy = validSortBy.includes(`${sortBy}`) ? `${sortBy}` : 'timestamp'
    const finalSortOrder = validSortOrder.includes(`${sortOrder}`.toUpperCase())
      ? `${sortOrder}`.toUpperCase()
      : 'DESC'

    const { count, rows } = await CallHistory.findAndCountAll({
      where,
      limit: limitNumber,
      offset,
      order: [[finalSortBy, finalSortOrder]],
      include: [
        // { model: Debtor, attributes: ['id', 'name'] },
        { model: User,  attributes: ['id', 'name', 'email'] },
      ],
    })

    return res.status(200).json({
      data: rows,
      total: count,
      page: pageNumber,
      totalPages: Math.ceil(count / limitNumber),
    })
  } catch (error: unknown) {
    console.error('[API][CALL-HISTORY]', error)
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return res.status(500).json({ message })
  }
}

export default withAuthAPI(handler)
