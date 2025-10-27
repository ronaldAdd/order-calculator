// pages/api/audit-log/index.ts

import type { NextApiRequest, NextApiResponse } from 'next'
import { Op, WhereOptions } from 'sequelize'
import withAuthAPI from '@/lib/withAuthAPI'
import AuditTrail from '@/models/audit-trail-ts'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' })
  }

  try {
    const {
      page = '1',
      limit = '20',
      actorId,
      actorName,
      actionType,
      targetEntityId,
      dateStart,
      dateEnd,
      sortBy = 'timestamp',
      sortOrder = 'DESC',
    } = req.query

    const where: WhereOptions = {}

    // Filtering
    if (actorId) where.actorId = actorId
    if (actorName) {
      where.actorName = {
        [Op.like]: `%${actorName}%`,
      }
    }
    if (actionType) where.actionType = actionType
    if (targetEntityId) where.targetEntityId = targetEntityId

    // Filter tanggal
    if (dateStart || dateEnd) {
      where.timestamp = {}
      if (dateStart) where.timestamp[Op.gte] = new Date(`${dateStart}T00:00:00`)
      if (dateEnd) where.timestamp[Op.lte] = new Date(`${dateEnd}T23:59:59`)
    }

    // Pagination
    const pageNumber = parseInt(page as string, 10)
    const limitNumber = parseInt(limit as string, 10)
    const offset = (pageNumber - 1) * limitNumber

    // Sorting
    const rawSortBy = Array.isArray(sortBy) ? sortBy[0] : sortBy
    const rawSortOrder = Array.isArray(sortOrder) ? sortOrder[0] : sortOrder

    const validSortBy = ['timestamp', 'actorId', 'actorName', 'actionType', 'targetEntityId']
    const validSortOrder = ['ASC', 'DESC']

    const finalSortBy: string = validSortBy.includes(rawSortBy) ? rawSortBy : 'timestamp'
    const finalSortOrder: 'ASC' | 'DESC' =
      validSortOrder.includes(rawSortOrder?.toUpperCase?.())
        ? (rawSortOrder.toUpperCase() as 'ASC' | 'DESC')
        : 'DESC'

    // Query ke database
    const { count, rows } = await AuditTrail.findAndCountAll({
      where,
      limit: limitNumber,
      offset,
      order: [[finalSortBy, finalSortOrder]],
    })

    return res.status(200).json({
      data: rows,
      total: count,
      page: pageNumber,
      totalPages: Math.ceil(count / limitNumber),
    })
  } catch (error: unknown) {
    console.error('[API][AUDIT-LOG]', error)
    if (error instanceof Error) {
      return res.status(500).json({ message: 'Internal Server Error', error: error.message })
    }
    return res.status(500).json({ message: 'Internal Server Error' })
  }
}

export default withAuthAPI(handler)
