import type { NextApiResponse } from 'next'
import type { AuthenticatedRequest } from '@/lib/withAuthAPI'
import Debtor from '@/models/debtor-ts'
import User from '@/models/user-ts'
import BankAccount from '@/models/bank-account-ts'
import Relation from '@/models/relations-ts'
import sequelize from '@/lib/db'
import withAuthAPI from '@/lib/withAuthAPI'
import { Op, WhereOptions } from 'sequelize'
import { initAssociations } from '@/models/associations'

initAssociations()

type DebtorWhere = WhereOptions & {
  [Op.or]?: WhereOptions[]
}

const handler = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ message: 'Method not allowed' })
    }

    await sequelize.authenticate()

    const {
      page = '1',
      limit = '10',
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      assignedCollector,
      search,
      status,
      forecast,
      productName,
      outstandingMin,
      outstandingMax,
    } = req.query

    const pageNumber = parseInt(page as string, 10)
    const limitNumber = parseInt(limit as string, 10)
    const offset = (pageNumber - 1) * limitNumber

    const where: DebtorWhere = {}

    // ✅ Filtering collector (null or empty string)
    if (req.user?.role === 'collector') {
      where.assignedCollector = req.user.uid
    } else if (assignedCollector === 'nullOrEmpty') {
      where.assignedCollector = {
        [Op.or]: [
          { [Op.is]: null },
          ''
        ]
      }
    } else if (typeof assignedCollector === 'string' && assignedCollector.trim() !== '') {
      where.assignedCollector = assignedCollector
    }

    // 🔍 Search filter
    if (search) {
      const s = (search as string).toLowerCase()
      where[Op.or] = [
        sequelize.where(sequelize.fn('LOWER', sequelize.col('firstName')), {
          [Op.like]: `%${s}%`,
        }),
        sequelize.where(sequelize.fn('LOWER', sequelize.col('lastName')), {
          [Op.like]: `%${s}%`,
        }),
        sequelize.where(sequelize.fn('LOWER', sequelize.col('loanId')), {
          [Op.like]: `%${s}%`,
        }),
      ]
    }

    // 🔘 Status
    if (typeof status === 'string' && status.trim() !== '') {
      where.status = status
    }

    // 🔘 Forecast
    if (typeof forecast === 'string' && forecast.trim() !== '') {
      where.forecast = forecast
    }

    // 🔘 Product Name (multi)
    if (productName) {
      const values = Array.isArray(productName) ? productName : [productName]
      where.productName = { [Op.in]: values }
    }

    // 🔘 Outstanding Min & Max
    if (outstandingMin || outstandingMax) {
      where.outstandingAmount = {}
      if (outstandingMin) {
        where.outstandingAmount[Op.gte] = Number(outstandingMin)
      }
      if (outstandingMax) {
        where.outstandingAmount[Op.lte] = Number(outstandingMax)
      }
    }

    const allowedSortFields = ['createdAt', 'firstName', 'lastName', 'productName', 'loanId']
    const orderField = allowedSortFields.includes(sortBy as string) ? (sortBy as string) : 'createdAt'
    const orderDirection = (sortOrder as string).toUpperCase() === 'DESC' ? 'DESC' : 'ASC'

    const { count, rows } = await Debtor.findAndCountAll({
      where,
      limit: limitNumber,
      offset,
      order: [[orderField, orderDirection]],
      include: [
        { model: User, attributes: ['id', 'name', 'email', 'role'] },
        { model: BankAccount, attributes: ['id', 'bankName', 'accountNumber', 'accountHolder'] },
        { model: Relation, attributes: ['id', 'relationName', 'relationshipType', 'relationPhone'] },
      ],
    })

    return res.status(200).json({
      data: rows,
      total: count,
      page: pageNumber,
      totalPages: Math.ceil(count / limitNumber),
    })
  } catch (error) {
    console.error('Error fetching debtors (bulk-distribution):', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

export default withAuthAPI(handler)
