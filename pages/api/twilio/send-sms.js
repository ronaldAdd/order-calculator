// pages/api/send-sms.js
import twilio from 'twilio'

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const fromNumber = process.env.TWILIO_PHONE_NUMBER

const client = twilio(accountSid, authToken)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { to, message } = req.body

  if (!to || !message) {
    return res.status(400).json({ error: 'Missing "to" or "message" in request body' })
  }

  try {
    const msg = await client.messages.create({
      body: message,
      from: fromNumber,
      to: to,
      statusCallback: 'https://desk-collection.vercel.app/api/twilio/call-logs',
      statusCallbackMethod: "POST",
      statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],      
    })
    console.log(msg,'msg');
    

    res.status(200).json({ success: true, sid: msg.sid })
  } catch (error) {
    console.error('Twilio Error:', error)
    res.status(500).json({ success: false, error: error.message })
  }
}
