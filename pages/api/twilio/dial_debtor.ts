// pages/api/twilio/dial_debtor.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { twiml } from 'twilio'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { number } = req.query

  // Validasi nomor
  if (!number || typeof number !== 'string') {
    res.status(400).send('Invalid phone number')
    return
  }

  const response = new twiml.VoiceResponse()

  // Dial nomor debtor (bridging)
  response.dial(number)
  console.log(response.toString(),'dial_debtor');
  

  res.setHeader('Content-Type', 'text/xml')
  res.status(200).send(response.toString())
}
