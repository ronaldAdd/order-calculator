import type { NextApiResponse } from 'next'
import withAuthAPI, { AuthenticatedRequest } from '@/lib/withAuthAPI'
import Debtor from '@/models/debtor-ts'
import { pusher } from '@/lib/pusherServer'

interface RequestBody {
  debtorIds: string[]
  collectorIds: string[]
  type: 'even' | 'roundrobin'
}

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { debtorIds, collectorIds, type }: RequestBody = req.body
  const uid = req.user?.uid || 'unknown'

  if (!Array.isArray(debtorIds) || !Array.isArray(collectorIds) || !type) {
    return res.status(400).json({ message: 'Invalid payload' })
  }

  if (collectorIds.length === 0) {
    return res.status(400).json({ message: 'No collectors selected' })
  }

  try {
    let updated = 0

    if (type === 'even') {
      const chunkSize = Math.ceil(debtorIds.length / collectorIds.length)
      for (let i = 0; i < collectorIds.length; i++) {
        const chunk = debtorIds.slice(i * chunkSize, (i + 1) * chunkSize)
        await Debtor.update(
          { assignedCollector: collectorIds[i] },
          { where: { id: chunk } }
        )
        updated += chunk.length

        const progress = Math.round((updated / debtorIds.length) * 100)
        await pusher.trigger(`distribution-${uid}`, 'distribution-progress', {
          progress,
        })
      }
    } else if (type === 'roundrobin') {
      for (let i = 0; i < debtorIds.length; i++) {
        const collectorId = collectorIds[i % collectorIds.length]
        await Debtor.update(
          { assignedCollector: collectorId },
          { where: { id: debtorIds[i] } }
        )
        updated++

        const progress = Math.round(((i + 1) / debtorIds.length) * 100)
        await pusher.trigger(`distribution-${uid}`, 'distribution-progress', {
          progress,
        })
      }
    }

    // ✅ Optional: kirim sinyal bahwa sudah complete
    await pusher.trigger(`distribution-${uid}`, 'distribution-progress', {
      progress: 100,
    })

    return res.status(200).json({ message: `${updated} debtors distributed` })
  } catch (error) {
    console.error('❌ Distribution Error:', error)
    return res.status(500).json({ message: 'Failed to distribute debtors' })
  }
}

export default withAuthAPI(handler)
