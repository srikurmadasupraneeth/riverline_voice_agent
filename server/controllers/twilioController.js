import twilio from "twilio";
import Conversation from "../models/Conversation.js";
import Borrower from "../models/Borrower.js";
import PromiseModel from "../models/Promise.js";
import { nextTurn } from "../utils/fsm.js";
import { auditEvent } from "../utils/audit.js";

const { VoiceResponse } = twilio.twiml;

/**
 * Handles incoming Twilio voice webhooks for ASR/TTS.
 * NOTE:
 *  - We use Amazon Polly voices via Twilio <Say> (NOT Google voices).
 *  - We do NOT use .prosody() here; Twilio Node helper expects plain text or SSML string.
 */
export async function voiceWebhook(req, res) {
  const twiml = new VoiceResponse();
  const { CallSid, SpeechResult, From, To } = req.body;

  try {
    // Borrower lookup by E.164 (+91XXXXXXXXXX) — we store phone as 10-digit in DB.
    const phoneDigits = (From || "")
      .replace("whatsapp:", "")
      .replace("+91", "");
    const borrower = await Borrower.findOne({ phone: phoneDigits });

    if (!borrower) {
      console.error(`Twilio Webhook: No borrower found for phone ${From}`);
      twiml.say("Sorry, I could not find your account.");
      twiml.hangup();
      res.type("text/xml");
      return res.send(twiml.toString());
    }

    // Reuse conversation per CallSid for audit continuity
    let conv = await Conversation.findOne({ "audit.CallSid": CallSid });
    if (!conv) {
      conv = new Conversation({
        borrower_id: borrower._id,
        channel: "voice",
        state: "CONTACT",
        tone: "neutral",
        turns: [],
        audit: [
          { type: "TWILIO_CALL_START", CallSid, From, To, at: new Date() },
        ],
        entities: {},
        experiments: [],
      });
      await conv.save();
    }

    // Choose a Polly voice (supported by Twilio <Say>)
    const voiceMap = {
      hi: "Polly.Kajal", // Hindi
      te: "Polly.Aditi", // Telugu (reads transliteration reasonably)
      en: "Polly.Aditi", // Indian English
    };
    const ttsVoice = voiceMap[borrower.language] || "Polly.Aditi";

    let agentReplyText = "";
    const lastUtterance = SpeechResult || null;

    if (lastUtterance) {
      // Borrower spoke → record turn
      conv.turns.push({
        role: "borrower",
        text: lastUtterance,
        language: borrower.language,
      });

      // FSM for reply + state transition
      const { nextState, response, action, entities } = nextTurn({
        state: conv.state,
        borrower,
        text: lastUtterance,
        tone: conv.tone,
        convEntities: conv.entities,
      });

      conv.state = nextState;
      conv.entities = entities;
      agentReplyText = response;

      conv.turns.push({
        role: "agent",
        text: agentReplyText,
        language: borrower.language,
      });

      // Handle CREATE_PTP side-effect
      if (action === "CREATE_PTP") {
        const amt = entities.amount || borrower.emi_amount;
        const due = entities.due_date || new Date(Date.now() + 7 * 864e5);
        await PromiseModel.create({
          borrower_id: borrower._id,
          amount: amt,
          due_date: due,
          status: "PTP",
        });
        borrower.active_ptp = true;
        await borrower.save();
        auditEvent(conv, "PTP_CREATED_VOICE", {
          CallSid,
          amount: amt,
          due_date: due,
        });
      }
    } else {
      // First agent greeting
      const { response, nextState } = nextTurn({
        state: "CONTACT",
        borrower,
        text: "",
        tone: "neutral",
        convEntities: {},
      });
      agentReplyText = response;
      conv.state = nextState;
      conv.turns.push({
        role: "agent",
        text: agentReplyText,
        language: borrower.language,
      });
    }

    await conv.save();

    // Say the agent reply (plain text, Polly voice)
    twiml.say({ voice: ttsVoice, language: "en-IN" }, agentReplyText);

    // If not resolved, continue gathering speech → post back to same webhook
    if (conv.state !== "RESOLVE" && conv.state !== "END") {
      twiml.gather({
        input: "speech",
        speechTimeout: "auto",
        speechModel: "phone_call",
        enhanced: true,
        action: "/api/twilio/voice",
        method: "POST",
      });
    } else {
      twiml.hangup();
      auditEvent(conv, "TWILIO_CALL_END", { CallSid, at: new Date() });
      await conv.save();
    }

    // Heads up to console about WA sandbox caveats (visible during demo logs)
    console.log(
      "[Twilio Voice] Reply spoken with",
      ttsVoice,
      "| For WhatsApp offers ensure target numbers are sandbox-opted-in."
    );

    res.type("text/xml");
    res.send(twiml.toString());
  } catch (error) {
    console.error("Twilio Webhook Error:", error);
    const fallback = new VoiceResponse();
    fallback.say("I am sorry, an internal error occurred. Goodbye.");
    fallback.hangup();
    res.type("text/xml");
    res.send(fallback.toString());
  }
}
