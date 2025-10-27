import { jwt } from 'twilio';

const AccessToken = jwt.AccessToken;
const VoiceGrant = AccessToken.VoiceGrant;

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const apiKey = process.env.TWILIO_API_KEY;
const apiSecret = process.env.TWILIO_API_SECRET;
const outgoingAppSid = process.env.TWILIO_TWIML_APP_SID; // TwiML App SID

export default function handler(req, res) {
  const { identity } = req.query;

  if (!identity) {
    return res.status(400).json({ error: 'Missing identity parameter' });
  }

  const voiceGrant = new VoiceGrant({
    outgoingApplicationSid: outgoingAppSid,
    incomingAllow: true, // Allow incoming calls
  });

  const token = new AccessToken(accountSid, apiKey, apiSecret, {
    identity,
  });

  token.addGrant(voiceGrant);

  res.status(200).json({ token: token.toJwt() });
}
