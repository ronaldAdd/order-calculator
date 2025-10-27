import type { NextApiResponse } from 'next'
import type { AuthenticatedRequest } from '@/lib/withAuthAPI'
import withAuthAPI from '@/lib/withAuthAPI'
import IngestionTemplate from '@/models/ingestion-template-ts'
import sequelize from '@/lib/db'

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    await sequelize.authenticate()

    if (req.method === 'GET') {
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 10
      const offset = (page - 1) * limit

      const { rows: templates, count: total } = await IngestionTemplate.findAndCountAll({
        order: [['createdAt', 'DESC']],
        limit,
        offset,
      })

      return res.status(200).json({
        data: templates,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      })
    }

    if (req.method === 'POST') {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' })

      const { name, headers, mapping } = req.body

      if (!name || !headers || !mapping) {
        return res.status(400).json({ error: 'Missing required fields' })
      }

      const newTemplate = await IngestionTemplate.create({
        name,
        headers,
        mapping,
        createdBy: req.user.uid,
      })

      return res.status(201).json(newTemplate)
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error: unknown) {
    console.error('❌ IngestionTemplate API Error:', error)

    return res.status(500).json({
      error: 'Internal server error',
      message: (error as Error).message || 'Unknown error',
    })
  }
}

export default withAuthAPI(handler)
