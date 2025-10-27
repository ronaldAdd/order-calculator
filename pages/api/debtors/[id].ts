import type { NextApiResponse } from 'next'
type NextApiResponseWithLocals = NextApiResponse & {
  locals?: Record<string, unknown> // bisa lebih ketat kalau tahu strukturnya
}
import type { AuthenticatedRequest } from '@/lib/withAuthAPI'
import sequelize from '@/lib/db'
import User from '@/models/user-ts'
import Debtor from '@/models/debtor-ts'
import BankAccount from '@/models/bank-account-ts'
import Relation from '@/models/relations-ts'
import { initAssociations } from '@/models/associations'
import debtorSchema from '@/schemas/debtorSchema'
import withAuthAndAudit from '@/lib/withAuthAndAudit'

initAssociations()

function sanitizeDateField(value: unknown): string | null {
  if (!value || typeof value !== 'string' || value === 'Invalid date') return null
  const date = new Date(value)
  return isNaN(date.getTime()) ? null : value
}

function sanitizePayload(payload: Record<string, unknown>): Record<string, unknown> {
  const clone = { ...payload }

  const dateFields = ['dob', 'lastPaymentDate', 'nextFollowUpDate']
  for (const field of dateFields) {
    clone[field] = sanitizeDateField(clone[field])
  }

  const numericFields = ['outstandingAmount', 'principalAmount', 'lastPaymentAmount', 'totalPaid']
  for (const field of numericFields) {
    const val = clone[field]
    if (val === '' || val === null || val === undefined) {
      clone[field] = null
    } else {
      const parsed = parseFloat(val.toString())
      clone[field] = isNaN(parsed) ? null : parsed
    }
  }

  return clone
}

type BankAccountInput = {
  id?: number
  accountType: string
  bankName: string
  accountNumber: string
  accountHolder: string
}

type RelationInput = {
  id?: number
  relationName: string
  relationshipType: string
  relationPhone?: string
}

async function updateRelations(debtorId: number, relations: RelationInput[], userId: string) {
  const existing = await Relation.findAll({ where: { debtorId } })
  const toDelete = existing.filter(r => !relations.some((rel) => String(rel.id) === String(r.id)))
  if (toDelete.length > 0) {
    await Relation.destroy({ where: { id: toDelete.map(r => r.id) } })
  }

  for (const rel of relations) {
    if (rel.id) {
      const existingRel = await Relation.findByPk(rel.id)
      if (existingRel) {
        await existingRel.update({ ...rel, updatedBy: userId })
      }
    } else {
      await Relation.create({ ...rel, debtorId, createdBy: userId, updatedBy: userId })
    }
  }
}

async function updateBankAccounts(debtorId: number, accounts: BankAccountInput[], userId: string) {
  const existing = await BankAccount.findAll({ where: { debtorId } })
  const toDelete = existing.filter(acc => !accounts.some((a) => String(a.id) === String(acc.id)))
  if (toDelete.length > 0) {
    await BankAccount.destroy({ where: { id: toDelete.map(a => a.id) } })
  }

  for (const acc of accounts) {
    if (acc.id) {
      const existingAcc = await BankAccount.findByPk(acc.id)
      if (existingAcc) {
        await existingAcc.update({ ...acc, updatedBy: userId })
      }
    } else {
      await BankAccount.create({ ...acc, debtorId, createdBy: userId, updatedBy: userId })
    }
  }
}

async function handler(req: AuthenticatedRequest, res: NextApiResponseWithLocals) {
  await sequelize.sync()
  const { id } = req.query

  if (typeof id !== 'string') {
    return res.status(400).json({ success: false, message: 'Invalid ID format' })
  }

  try {
    const debtor = await Debtor.findByPk(id, {
      include: [
        { model: User, attributes: ['id', 'name', 'email', 'role'] },
        { model: BankAccount, attributes: ['id', 'accountType', 'bankName', 'accountNumber', 'accountHolder'] },
        { model: Relation, attributes: ['id', 'relationName', 'relationshipType', 'relationPhone'] },
      ],
    })

    if (!debtor) {
      return res.status(404).json({ success: false, message: 'Debtor not found' })
    }

    // 🔐 Cek role saat GET
    if (req.method === 'GET') {
      if (req.user?.role === 'collector' && debtor.assignedCollector !== req.user.uid) {
        return res.status(403).json({ success: false, message: 'Tidak diizinkan mengakses data ini' })
      }

      return res.status(200).json({ success: true, data: debtor })
    }

    if (req.method === 'PUT') {
      const role = req.user?.role
      const uid = req.user?.uid

      // 🔍 Simpan old data untuk audit
      res.locals = res.locals || {}
      res.locals.oldData = { ...debtor.dataValues }


      if (role === 'collector') {
        if (debtor.assignedCollector !== uid) {
          return res.status(403).json({ success: false, message: 'Debtor tidak bisa diperbarui oleh Anda.' })
        }

        const allowedFields = ['status', 'forecast'] as const
        const updateData: Partial<Pick<typeof debtor, 'status' | 'forecast'>> = {}

        for (const key of allowedFields) {
          if (key in req.body) {
            updateData[key] = req.body[key as keyof typeof req.body]
          }
        }

        if (Object.keys(updateData).length === 0) {
          return res.status(400).json({ success: false, message: 'Tidak ada data yang bisa diperbarui.' })
        }

        await debtor.update({ ...updateData, updatedBy: uid })
        res.locals.newData = { ...debtor.dataValues } // ← Tambahkan ini
        return res.status(200).json({ success: true, message: 'Data berhasil diperbarui.', data: debtor })
      }


      const parsed = debtorSchema.safeParse(req.body)
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: 'Validasi gagal',
          errors: parsed.error.format(),
        })
      }      

      // Admin/editor
      const cleanedPayload = sanitizePayload(parsed.data)
      await debtor.update({ ...cleanedPayload, updatedBy: req.user?.uid ?? null })
      res.locals.newData = { ...debtor.dataValues } // ← Tambahkan ini juga

      if (req.body.BankAccounts) {
        await updateBankAccounts(debtor.id, req.body.BankAccounts as BankAccountInput[], req.user?.uid ?? '')
      }

      if (req.body.Relations) {
        await updateRelations(debtor.id, req.body.Relations as RelationInput[], req.user?.uid ?? '')
      }

      return res.status(200).json({ success: true, message: 'Data berhasil diperbarui.', data: debtor })
    }

    if (req.method === 'DELETE') {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Hanya admin yang dapat menghapus data debtor.',
        })
      }

      // Hapus relasi dulu
      // await BankAccount.destroy({ where: { debtorId: debtor.id } })
      // await Relation.destroy({ where: { debtorId: debtor.id } })

      await debtor.destroy()
      return res.status(204).end()
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' })
  } catch (err: unknown) {
    const error = err as Error
    console.error('❌ Error:', error)
    return res.status(500).json({ success: false, message: error.message || 'Internal server error' })
  }
}

// export default withAuthAPI(handler)
export default withAuthAndAudit(handler, {
  getActionType: (req) => `DEBTOR_${req.method}`,
  getTargetEntityType: () => 'Debtor',
  getTargetId: (req) => {
    const id = req.query.id
    return typeof id === 'string' ? id : 'N/A'
  },
  getDescription: (req) => {
    const id = typeof req.query.id === 'string' ? req.query.id : 'N/A'
    if (req.method === 'GET') return `Viewed debtor detail (id=${id})`
    if (req.method === 'PUT') return `Updated debtor (id=${id})`
    if (req.method === 'DELETE') return `Deleted debtor (id=${id})`
    return `Accessed debtor detail endpoint (method=${req.method})`
  },
  // ✅ Biarkan kosong, audit log akan generate otomatis di middleware
  //getDetails: () => ({}),
})
