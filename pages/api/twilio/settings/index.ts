import type { AuthenticatedRequest } from '@/lib/withAuthAPI'
import type { ExtendedResponse } from '@/lib/withAuthAndAudit'
import withAuthAndAudit from '@/lib/withAuthAndAudit'
import sequelize from '@/lib/db'
import TwilioSetting from '@/models/twilio-setting'

async function handler(req: AuthenticatedRequest, res: ExtendedResponse) {
  
  try {
    await sequelize.authenticate()

    if (req.method === 'GET') {
      const setting = await TwilioSetting.findOne()
      return res.status(200).json({ data: setting })
    }

    if (req.method === 'POST') {
      const { accountSid, authToken, phoneNumber, enabled } = req.body

      if (!accountSid || !authToken || !phoneNumber) {
        return res.status(400).json({ error: 'All fields are required' })
      }

      const [setting, created] = await TwilioSetting.upsert({
        id: 1,
        accountSid,
        authToken,
        phoneNumber,
        enabled,
      })

      res.locals = { twilioSetting: setting }

      return res.status(created ? 201 : 200).json({
        message: created ? 'Twilio setting created' : 'Twilio setting updated',
        data: setting,
      })
    }

    if (req.method === 'PUT') {
      const { accountSid, authToken, phoneNumber, enabled } = req.body

      const setting = await TwilioSetting.findByPk(1)
      if (!setting) {
        return res.status(404).json({ error: 'Twilio setting not found' })
      }

      setting.accountSid = accountSid ?? setting.accountSid
      setting.authToken = authToken ?? setting.authToken
      setting.phoneNumber = phoneNumber ?? setting.phoneNumber
      setting.enabled = enabled ?? setting.enabled

      await setting.save()
      res.locals = { twilioSetting: setting }

      return res.status(200).json({
        message: 'Twilio setting updated via PUT',
        data: setting,
      })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error: unknown) {
    console.error('❌ Twilio API error:', error)
    return res.status(500).json({
      error: 'Internal server error',
      message: (error as Error).message || 'Unknown error',
    })
  }
}

export default withAuthAndAudit(handler, {
  getActionType: (req) => `TWILIO_${req.method}`,
  getTargetEntityType: () => 'TwilioSetting',
  getTargetId: (req, res) => {
    const locals = res.locals as { twilioSetting?: { id?: number } }
    return locals?.twilioSetting?.id?.toString() || 'N/A'
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getDescription: (req, res) => {
    if (req.method === 'GET') return 'Viewed Twilio settings'
    if (req.method === 'POST') return 'Created/Updated Twilio settings via POST'
    if (req.method === 'PUT') return 'Updated Twilio settings via PUT'
    return `Accessed Twilio settings endpoint with method ${req.method}`
  },
  getDetails: (req) => ({
    method: req.method,
    body: req.body,
  }),
})
