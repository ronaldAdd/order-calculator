import type { AuthenticatedRequest } from '@/lib/withAuthAPI'
import type { ExtendedResponse } from '@/lib/withAuthAndAudit'
import Debtor from '@/models/debtor-ts'
import User from '@/models/user-ts'
import BankAccount from '@/models/bank-account-ts'
import Relation from '@/models/relations-ts'
import sequelize from '@/lib/db'
import { Op, WhereOptions } from 'sequelize'
import { initAssociations } from '@/models/associations'
import debtorSchema from '@/schemas/debtorSchema'
import withAuthAndAudit from '@/lib/withAuthAndAudit'

type DebtorPayload = {
  [key: string]: string | number | null | undefined
}

type DebtorWhere = WhereOptions & {
  [Op.or]?: WhereOptions[]
}

interface EmergencyContactInput {
  relationName: string
  relationshipType: string
  relationPhone: string
}

interface BankAccountInput {
  accountType?: string
  bankName: string
  accountNumber: string
  accountHolder: string
}

function sanitizeDebtorPayload(body: DebtorPayload): DebtorPayload {
  const cleaned: DebtorPayload = { ...body }

  for (const key in cleaned) {
    const value = cleaned[key]

    if (value === '' || value === 'Invalid date') {
      cleaned[key] = null
    }

    if (
      ['outstandingAmount', 'principalAmount', 'lastPaymentAmount', 'totalPaid'].includes(key)
    ) {
      cleaned[key] = value === '' || isNaN(Number(value as number)) ? null : Number(value)
    }
  }

  return cleaned
}

initAssociations()

async function handler(req: AuthenticatedRequest, res: ExtendedResponse) {
  let rawPayload = null
  try {
    await sequelize.authenticate()

    if (req.method === 'GET') {
      const {
        page = '1',
        limit = '10',
        sortBy = 'createdAt',
        sortOrder = 'DESC',
        firstName,
        lastName,
        sex,
        dob,
        nationalId,
        religion,
        maritalStatus,
        email,
        mobilePhones,
        homePhone,
        officePhone,
        address,
        jobTitle,
        employerName,
        officeAddress,
        loanId,
        productName,
        status,
        forecast,
        assignedCollector,
        isHighPriority,
        outstandingMin,
        outstandingMax,
        nextFollowUpStart,
        nextFollowUpEnd,
        search,
      } = req.query

      const pageNumber = parseInt(page as string, 10)
      const limitNumber = parseInt(limit as string, 10)
      const offset = (pageNumber - 1) * limitNumber

      const where: DebtorWhere = {}

      const whereLikeCI = (column: string, value: string | string[]) => {
        if (Array.isArray(value)) {
          return {
            [Op.or]: value.map((v) =>
              sequelize.where(sequelize.fn('LOWER', sequelize.col(column)), {
                [Op.like]: `%${v.toLowerCase()}%`,
              })
            ),
          }
        }

        return sequelize.where(sequelize.fn('LOWER', sequelize.col(column)), {
          [Op.like]: `%${value.toLowerCase()}%`,
        })
      }

      if (firstName) where.firstName = whereLikeCI('firstName', firstName)
      if (lastName) where.lastName = whereLikeCI('lastName', lastName)
      if (sex) where.sex = whereLikeCI('sex', sex)
      if (dob) where.dob = dob as string
      if (nationalId) where.nationalId = whereLikeCI('nationalId', nationalId)
      if (religion) where.religion = whereLikeCI('religion', religion)
      if (maritalStatus) where.maritalStatus = whereLikeCI('maritalStatus', maritalStatus)
      if (email) where.email = whereLikeCI('email', email)
      if (mobilePhones) where.mobilePhones = whereLikeCI('mobilePhones', mobilePhones)
      if (homePhone) where.homePhone = whereLikeCI('homePhone', homePhone)
      if (officePhone) where.officePhone = whereLikeCI('officePhone', officePhone)
      if (address) where.address = whereLikeCI('address', address)
      if (jobTitle) where.jobTitle = whereLikeCI('jobTitle', jobTitle)
      if (employerName) where.employerName = whereLikeCI('employerName', employerName)
      if (officeAddress) where.officeAddress = whereLikeCI('officeAddress', officeAddress)
      if (loanId) where.loanId = whereLikeCI('loanId', loanId)
      if (productName) where.productName = whereLikeCI('productName', productName)
      if (status) where.status = whereLikeCI('status', status)
      if (forecast) where.forecast = whereLikeCI('forecast', forecast)

      if (typeof isHighPriority === 'string') {
        if (isHighPriority === 'true') where.isHighPriority = true
        else if (isHighPriority === 'false') where.isHighPriority = false
      }

      if (req.user?.role === 'collector') {
        where.assignedCollector = req.user.uid
      } else if (assignedCollector && typeof assignedCollector === 'string' && assignedCollector.trim() !== '') {
        where.assignedCollector = assignedCollector
      }

      if (outstandingMin || outstandingMax) {
        where.outstandingAmount = {}
        if (outstandingMin) where.outstandingAmount[Op.gte] = Number(outstandingMin)
        if (outstandingMax) where.outstandingAmount[Op.lte] = Number(outstandingMax)
      }

      if (search) {
        const s = (search as string).toLowerCase()
        where[Op.or] = [
          whereLikeCI('firstName', s),
          whereLikeCI('lastName', s),
          whereLikeCI('loanId', s),
          whereLikeCI('mobilePhones', s),
          whereLikeCI('homePhone', s),
          whereLikeCI('email', s),
          whereLikeCI('assignedCollector', s),
          whereLikeCI('productName', s),
        ]
      }

      // ✅ Tambahkan filter date range nextFollowUpDate
      if (nextFollowUpStart || nextFollowUpEnd) {
        where.nextFollowUpDate = {}
        if (nextFollowUpStart) {
          where.nextFollowUpDate[Op.gte] = new Date(`${nextFollowUpStart}T00:00:00`)
        }
        if (nextFollowUpEnd) {
          where.nextFollowUpDate[Op.lte] = new Date(`${nextFollowUpEnd}T23:59:59`)
        }
      }

      const allowedSortFields = [
        'createdAt',
        'outstandingAmount',
        'nextFollowUpDate',
        'assignedCollector',
        'firstName',
        'lastName',
        'productName',
        'loanId',
        'status',
      ]

      const orderField = allowedSortFields.includes(sortBy as string) ? (sortBy as string) : 'createdAt'
      const orderDirection = (sortOrder as string).toUpperCase() === 'DESC' ? 'DESC' : 'ASC'

      const { count, rows } = await Debtor.findAndCountAll({
        where,
        limit: limitNumber,
        offset,
        order: [[orderField, orderDirection]],
        include: [
          { model: User, attributes: ['id', 'name', 'email', 'role'] },
          { model: BankAccount, attributes: ['id', 'accountType', 'bankName', 'accountNumber', 'accountHolder'] },
          { model: Relation, attributes: ['id', 'relationName', 'relationshipType', 'relationPhone'] },
        ],
      })

      return res.status(200).json({
        data: rows,
        total: count,
        page: pageNumber,
        totalPages: Math.ceil(count / limitNumber),
      })
    }

    if (req.method === 'POST') {
      rawPayload = req.body
      const parsed = debtorSchema.safeParse(rawPayload)

      if (!parsed.success) {
        return res.status(400).json({ error: 'Validation failed', details: parsed.error.format() })
      }

      const sanitizedData = sanitizeDebtorPayload(req.body as DebtorPayload)

      if (!req.user) return res.status(401).json({ error: 'Unauthorized' })

      sanitizedData.createdBy = req.user.uid
      const newDebtor = await Debtor.create(sanitizedData)
      // ⬅️ Tambahkan ini
      res.locals = {
        ...res.locals,
        newDebtor,
      }      

      const contacts = req.body.Relations as EmergencyContactInput[] | undefined
      if (Array.isArray(contacts)) {
        const relationData = contacts.map((contact) => ({
          debtorId: newDebtor.id,
          relationName: contact.relationName,
          relationshipType: contact.relationshipType,
          relationPhone: contact.relationPhone,
          createdBy: req.user!.uid,
        }))
        await Relation.bulkCreate(relationData)
      }

      const accounts = req.body.BankAccounts as BankAccountInput[] | undefined
      if (Array.isArray(accounts)) {
        const accountData = accounts.map((acc) => ({
          debtorId: newDebtor.id,
          accountType: acc.accountType || 'Bank Account',
          bankName: acc.bankName,
          accountNumber: acc.accountNumber,
          accountHolder: acc.accountHolder,
          createdBy: req.user!.uid,
        }))
        await BankAccount.bulkCreate(accountData)
      }

      return res.status(201).json(newDebtor)
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error: unknown) {
    console.error('❌ Database error:', error)

  if (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    error.name === 'SequelizeUniqueConstraintError'
  ) {
    const sequelizeError = error as {
      name: string
      errors?: { message?: string; path?: string; value?: string }[]
    }

    const message = sequelizeError?.errors?.[0]?.message || 'Duplicate entry detected'
    const field = sequelizeError?.errors?.[0]?.path || 'unknown_field'
    const value = sequelizeError?.errors?.[0]?.value || 'unknown_value'

    return res.status(409).json({
      error: 'Duplicate entry',
      message, // ← pastikan ini ada
      field,
      value,
      payload: rawPayload,
    })
  }
    return res.status(500).json({
      error: 'Internal server error',
      message: (error as Error).message || 'Unknown error occurred',
      payload: rawPayload,
    })
  }
}

// export default withAuthAPI(handler)

export default withAuthAndAudit(handler, {
  getActionType: (req) => `DEBTOR_${req.method}`, // POST → DEBTOR_POST
  getTargetEntityType: () => 'Debtor',
  getTargetId: (req, res) => {
    const locals = res.locals as { newDebtor?: { id?: string } }
    return locals?.newDebtor?.id || 'N/A'
  },
  getDescription: (req, res) => {
    const locals = res.locals as { newDebtor?: { firstName?: string } }
    if (req.method === 'GET') return 'Viewed Debtor List'
    if (req.method === 'POST') return `Created debtor ${locals?.newDebtor?.firstName || ''}`
    return `Accessed debtor endpoint with method ${req.method}`
  },
  getDetails: (req) => ({
    method: req.method,
    query: req.query,
    body: req.body,
  }),
})

