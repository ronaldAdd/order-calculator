// pages/api/twilio/make-call.js
import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, message, voice = "alice", language = "id-ID" } = req.body;

  if (!to || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const VoiceResponse = twilio.twiml.VoiceResponse;
    const response = new VoiceResponse();

    response.say(
      { voice, language },
      message
    );

    const call = await client.calls.create({
      from: fromNumber,
      to: to,
      twiml: response.toString(),
      statusCallback: 'https://desk-collection.vercel.app/api/twilio/call-logs',
      statusCallbackMethod: "POST",
      statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
      record: true      
    });

    res.status(200).json({ success: true, sid: call.sid });
  } catch (error) {
    console.error("Twilio Call Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}
