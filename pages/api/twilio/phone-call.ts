import type { AuthenticatedRequest } from '@/lib/withAuthAPI'
import type { ExtendedResponse } from '@/lib/withAuthAndAudit'
import withAuthAndAudit from '@/lib/withAuthAndAudit'
import sequelize from '@/lib/db'
import TwilioSetting from '@/models/twilio-setting'
import CallHistory from '@/models/call-history-ts'
import twilio from 'twilio'

async function handler(req: AuthenticatedRequest, res: ExtendedResponse) {
  try {
    await sequelize.authenticate()

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const { to, debtorNumber, debtorData } = req.body

    console.log(debtorData,req.user?.uid,'PAYLOAD CALL HISTORY');


    if (!to || !debtorNumber || !debtorData) {
      return res.status(400).json({ error: 'Missing required fields: to, debtorNumber, debtorData' })
    }

    // Ambil setting Twilio dari DB
    const setting = await TwilioSetting.findByPk(1)

    if (!setting || !setting.enabled) {
      return res.status(503).json({ error: 'Twilio is not configured or disabled' })
    }

    const client = twilio(setting.accountSid, setting.authToken)

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://desk-collection.vercel.app'

    const phoneRegex = /^\+?[1-9]\d{6,14}$/;
    if (!to || !debtorNumber || !phoneRegex.test(to) || !phoneRegex.test(debtorNumber)) {
      return res.status(400).json({ error: 'Missing or invalid phone numbers' });
    }  
    
    const call = await client.calls.create({
      from: setting.phoneNumber,
      to,
      url: `${baseUrl}/api/twilio/dial_debtor?number=${encodeURIComponent(debtorNumber)}`,
      statusCallback: `${baseUrl}/api/twilio/call-logs`,
      statusCallbackMethod: 'POST',
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      record: true,
    })

    res.locals = { twilioCall: call }

    //JIKA BERHASIL,SIMPAN KE TABEL call history
    // Simpan ke tabel call_histories
    await CallHistory.create({
      debtorId: debtorData?.id,
      collectorId: req.user?.uid || 'unknown',
      notes:'',
      callOutcome: '',
      ptpDate:debtorData?.nextFollowUpDate,
      ptpAmount:debtorData?.outstandingAmount,
      timestamp: new Date(),
      callSid: call.sid,
      createdBy: req.user?.uid || null,
      updatedBy: req.user?.uid || null,      
    })    

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
