import type { NextApiRequest, NextApiResponse } from 'next'
import CallLog from '@/models/call-log'
import CallHistory from '@/models/call-history-ts' // pastikan model ini ada dan benar

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const data = req.body

    if (!data || typeof data !== 'object') {
      return res.status(400).json({ message: 'Invalid request body' })
    }

    // Simpan data JSON mentah ke tabel call_log (jika masih ingin disimpan)
    await CallLog.create({ data_json: data })

    // Update callStatus ke tabel call_history_ts berdasarkan CallSid
    if (data.CallSid && data.CallStatus) {
      const updated = await CallHistory.update(
        { callStatus: data.CallStatus ,recordingUrl : data.RecordingUrl ,callDuration:data.CallDuration  },
        { where: { callSid: data.CallSid } }
      )

      if (updated[0] === 0) {
        console.warn('No matching callSid found to update in call_history_ts')
      }
    }

    return res.status(200).json({ message: 'Call log processed' })
  } catch (error) {
    console.error('Error processing call log:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

export default handler
