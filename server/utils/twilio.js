import twilio from "twilio";
import { config } from "../config.js";

const hasTwilioCreds = config.twilio.accountSid && config.twilio.authToken;
const client = hasTwilioCreds
  ? twilio(config.twilio.accountSid, config.twilio.authToken)
  : null;

/** Format 10-digit Indian number to E.164 */
function formatE164(phone) {
  if (!phone) return "";
  if (phone.startsWith("+")) return phone;
  return `+91${phone}`;
}

/** Format for WhatsApp delivery */
function formatWhatsAppNumber(phone) {
  if (!phone) return "";
  if (phone.startsWith("whatsapp:")) return phone;
  return `whatsapp:${formatE164(phone)}`;
}

/** Send WhatsApp message via Twilio */
export async function sendWhatsApp(to, body) {
  if (!client)
    return { ok: false, error: "Twilio credentials not configured." };

  const from = config.twilio.whatsappNumber;
  const toFormatted = formatWhatsAppNumber(to);

  if (!from || !from.startsWith("whatsapp:")) {
    const msg =
      "TWILIO_WHATSAPP_NUMBER is not set to a valid WhatsApp sender (e.g., whatsapp:+1415xxxxxxx).";
    console.warn(msg);
    return { ok: false, error: msg };
  }

  try {
    const message = await client.messages.create({
      from,
      to: toFormatted,
      body,
    });
    console.log(`WhatsApp message sent: ${message.sid}`);
    return { ok: true, sid: message.sid };
  } catch (error) {
    console.error(`Error sending WhatsApp to ${toFormatted}:`, error.message);
    console.warn(
      "If you're using WhatsApp Sandbox, ensure the recipient is opted-in to the sandbox."
    );
    return { ok: false, error: error.message };
  }
}

/** Make outbound voice call via Twilio */
export async function makeCall(to, webhookUrl) {
  if (!client)
    return { ok: false, error: "Twilio credentials not configured." };

  const toFormatted = formatE164(to);
  const from = config.twilio.voiceNumber; // MUST be a Twilio voice-enabled number

  if (!from || !from.startsWith("+")) {
    const msg =
      "TWILIO_VOICE_NUMBER is not set to a valid E.164 number. Calls cannot be placed in demo mode without it.";
    console.warn(msg);
    return { ok: false, error: msg };
  }

  if (!/^https?:\/\//i.test(webhookUrl) || webhookUrl.includes("localhost")) {
    const msg =
      "WEBHOOK_BASE_URL must be a public HTTPS URL (ngrok or deployed) for Twilio callbacks.";
    console.warn(msg);
    return { ok: false, error: msg };
  }

  try {
    const call = await client.calls.create({
      url: webhookUrl, // TwiML webhook
      to: toFormatted,
      from,
    });
    console.log(`Twilio call initiated: ${call.sid}`);
    return { ok: true, sid: call.sid };
  } catch (error) {
    console.error(`Error making call to ${toFormatted}:`, error.message);
    return { ok: false, error: error.message };
  }
}
