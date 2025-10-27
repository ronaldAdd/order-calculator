import type { AuthenticatedRequest } from '@/lib/withAuthAPI'
import type { ExtendedResponse } from '@/lib/withAuthAndAudit'
import withAuthAndAudit from '@/lib/withAuthAndAudit'
import sequelize from '@/lib/db'
import TwilioSetting from '@/models/twilio-setting'
import twilio from 'twilio'

async function handler(req: AuthenticatedRequest, res: ExtendedResponse) {
  try {
    await sequelize.authenticate()

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const { to, message, voice = 'alice', language = 'id-ID' } = req.body

    if (!to || !message) {
      return res.status(400).json({ error: 'Missing required fields: to, message' })
    }

    // Ambil setting Twilio dari DB
    const setting = await TwilioSetting.findByPk(1)

    if (!setting || !setting.enabled) {
      return res.status(503).json({ error: 'Twilio is not configured or disabled' })
    }

    const client = twilio(setting.accountSid, setting.authToken)
    const VoiceResponse = twilio.twiml.VoiceResponse
    const response = new VoiceResponse()

    response.say({ voice, language }, message)

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://desk-collection.vercel.app'

    const call = await client.calls.create({
      from: setting.phoneNumber,
      to,
      twiml: response.toString(),
      statusCallback: `${baseUrl}/api/twilio/call-logs`,
      statusCallbackMethod: 'POST',
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      record: true,
    })

    res.locals = { twilioCall: call }

    return res.status(200).json({ success: true, sid: call.sid })
  } catch (error: unknown) {
    console.error('❌ Twilio Call Error:', error)
    return res.status(500).json({
      error: 'Internal server error',
      message: (error as Error).message || 'Unknown error',
    })
  }
}

export default withAuthAndAudit(handler, {
  getActionType: () => 'TWILIO_CALL',
  getTargetEntityType: () => 'TwilioCall',
  getTargetId: (req, res) => {
    const locals = res.locals as { twilioCall?: { sid?: string } }
    return locals.twilioCall?.sid || 'N/A'
  },
  getDescription: () => 'Melakukan panggilan via Twilio',
  getDetails: (req) => ({
    method: req.method,
    body: req.body,
  }),
})
