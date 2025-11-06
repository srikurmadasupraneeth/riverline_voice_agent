// server/utils/fsm.js
import { interpretUtterance } from "./nlp.js";

// --- 1. NEW LOCALIZATION ENGINE ---

const translations = {
  // Greetings and Verification
  GREET: {
    en: (name) => `Hello ${name}, this is Riverline.`,
    hi: (name) => `नमस्ते ${name} जी, मैं रिवरलाइन से बात कर रहा हूँ।`,
    te: (name) =>
      `నమస్కారం ${name} గారు, నేను రివర్‌లైన్ నుండి మాట్లాడుతున్నాను.`,
  },
  VERIFY: {
    en: (name) => `Am I speaking to ${name}?`,
    hi: (name) => `क्या मैं ${name} जी से बात कर रहा हूँ?`,
    te: (name) => `నేను ${name} గారితో మాట్లాడుతున్నానా?`,
  },
  VERIFY_FAIL: {
    en: (name) => `Please confirm your name is ${name} to continue.`,
    hi: (name) => `कृपया पुष्टि करें कि आपका नाम ${name} जी है।`,
    te: (name) => `దయచేసి మీ పేరు ${name} గారు అని నిర్ధారించండి.`,
  },
  // Intent & Asking for Payment
  THANKS_AND_ASK: {
    en: (name, due) =>
      `Thanks ${name}. You have ₹${due} due. Are you able to pay now or would you like a payment plan?`,
    hi: (name, due) =>
      `धन्यवाद ${name} जी। आपका ₹${due} बकाया है। क्या आप अभी भुगतान कर सकते हैं या आप भुगतान योजना चाहेंगे?`,
    te: (name, due) =>
      `ధన్యవాదాలు ${name} గారు. మీకు ₹${due} బకాయి ఉంది. మీరు ఇప్పుడే చెల్లించగలరా లేదా మీకు పేమెంట్ ప్లాన్ కావాలా?`,
  },
  ASK_DUE: {
    en: (due) =>
      `Your total due is ₹${due}. Would you like to pay now or set a date?`,
    hi: (due) =>
      `आपका कुल बकाया ₹${due} है। क्या आप अभी भुगतान करना चाहेंगे या कोई तारीख तय करना चाहेंगे?`,
    te: (due) =>
      `మీ మొత్తం బకాయి ₹${due}. మీరు ఇప్పుడే చెల్లించాలనుకుంటున్నారా లేదా తేదీని సెట్ చేయాలనుకుంటున్నారా?`,
  },
  // Planning and PTP
  ASK_PLAN: {
    en: () =>
      'Sure. What amount and what date works for you? You can say for example "₹1200 next Friday".',
    hi: () =>
      'ज़रूर। आपके लिए कौन सी राशि और कौन सी तारीख सही रहेगी? उदाहरण के लिए, आप "₹1200 अगले शुक्रवार" कह सकते हैं।',
    te: () =>
      'తప్పకుండా. మీకు ఏ మొత్తం మరియు ఏ తేదీ సరిపోతుంది? ఉదాహరణకు, "₹1200 వచ్చే శుక్రవారం" అని చెప్పవచ్చు.',
  },
  HARDSHIP_PLAN: {
    en: () =>
      "Thanks for sharing. We can set a smaller amount and a later date. Tell me an amount and a date.",
    hi: () =>
      "बताने के लिए धन्यवाद। हम कम राशि और बाद की तारीख तय कर सकते हैं। मुझे एक राशि और एक तारीख बताएं।",
    te: () =>
      "చెప్పినందుకు ధన్యవాదాలు. మనం తక్కువ మొత్తం మరియు తర్వాతి తేదీని సెట్ చేసుకోవచ్చు. దయచేసి మొత్తం మరియు తేదీ చెప్పండి.",
  },
  PREVIEW_PTP: {
    en: (amt, date) =>
      `Okay. I noted ₹${amt} by ${date}. Shall I confirm this as a Promise-to-Pay?`,
    hi: (amt, date) =>
      `ठीक है। मैंने ₹${amt}, ${date} तक नोट कर लिया है। क्या मैं इसे Promise-to-Pay के रूप में पक्का करूँ?`,
    te: (amt, date) =>
      `సరే. నేను ₹${amt}, ${date} నాటికి నోట్ చేసుకున్నాను. దీనిని Promise-to-Pay గా నిర్ధారించాలా?`,
  },
  CONFIRM_PTP: {
    en: (amt, date) =>
      `Done. I have recorded a promise of ₹${amt} by ${date}. I will send a WhatsApp confirmation.`,
    hi: (amt, date) =>
      `हो गया। मैंने ₹${amt}, ${date} तक का वादा दर्ज कर लिया है। मैं आपको WhatsApp पर पुष्टि भेज दूँगा।`,
    te: (amt, date) =>
      `పూర్తయింది. నేను ₹${amt}, ${date} నాటికి వాగ్దానాన్ని రికార్డ్ చేసాను. నేను WhatsApp నిర్ధారణ పంపుతాను.`,
  },
  // Fallbacks and Closing
  CALLBACK: {
    en: () => "Sure. I will schedule a callback. What time suits you?",
    hi: () =>
      "ज़रूर। मैं एक कॉलबैक शेड्यूल कर दूँगा। आपके लिए कौन सा समय सही रहेगा?",
    te: () =>
      "తప్పకుండా. నేను కాల్‌బ్యాక్ షెడ్యూల్ చేస్తాను. మీకు ఏ సమయం అనుకూలంగా ఉంటుంది?",
  },
  ASK_AGAIN: {
    en: () =>
      'Please tell me the amount and the date (for example "₹1000 on 10/11").',
    hi: () =>
      'कृपया मुझे राशि और तारीख बताएं (उदाहरण के लिए "₹1000, 10/11 को")।',
    te: () =>
      'దయచేసి నాకు మొత్తం మరియు తేదీ చెప్పండి (ఉదాహరణకు "₹1000, 10/11 న")।',
  },
  PLAN_AGAIN: {
    en: () =>
      "Please confirm the amount and the date so I can record your promise.",
    hi: () =>
      "कृपया राशि और तारीख की पुष्टि करें ताकि मैं आपका वादा दर्ज कर सकूं।",
    te: () =>
      "దయచేసి మీ వాగ్దానాన్ని రికార్డ్ చేయడానికి మొత్తం మరియు తేదీని నిర్ధారించండి.",
  },
  PLAN_MISSING_DATE: {
    en: () => "Sorry, I missed that. What date can you pay?",
    hi: () =>
      "माफ़ कीजिए, मैं सुन नहीं पाया। आप किस तारीख को भुगतान कर सकते हैं?",
    te: () => "క్షమించండి, నాకు అర్థం కాలేదు. మీరు ఏ తేదీన చెల్లించగలరు?",
  },
  RESOLVE: {
    en: () =>
      "I’ve recorded this. You’ll receive a WhatsApp summary. Thank you.",
    hi: () =>
      "मैंने इसे दर्ज कर लिया है। आपको WhatsApp पर सारांश मिल जाएगा। धन्यवाद।",
    te: () =>
      "నేను దీనిని రికార్డ్ చేసాను. మీరు WhatsApp సారాంశం అందుకుంటారు. ధన్యవాదాలు.",
  },
};

/**
 * Gets the localized string for an agent's turn.
 * @param {string} lang - 'en', 'hi', or 'te'
 * @param {string} tone - 'empathetic', 'urgent', 'neutral'
 * @param {string} sentiment - 'positive', 'negative', 'neutral'
 * @param {string} key - The key from the translations object
 * @param  {...any} args - Arguments for the translation function
 */
function localize(lang = "en", tone, sentiment, key, ...args) {
  const langKey = translations[key]?.[lang] ? lang : "en"; // Default to English
  let text = translations[key][langKey](...args);

  // Add prefixes based on tone and language
  let prefix = "";
  if (tone === "empathetic" || sentiment === "negative") {
    prefix =
      langKey === "hi"
        ? "मैं समझता हूँ। "
        : langKey === "te"
        ? "నాకు అర్థం అయింది. "
        : "I understand. ";
  }

  if (tone === "urgent") {
    prefix =
      langKey === "hi"
        ? "ज़रूरी सूचना: "
        : langKey === "te"
        ? "ముఖ్య గమనిక: "
        : "Important: ";
  }

  // In Hindi, ensure respectful "ji" is added if not already part of the phrase
  // (Our templates add it, but this is a good safeguard)
  if (langKey === "hi" && text.includes("जी") === false && args[0]) {
    // This logic is complex; for now, we rely on good templates.
    // Example: text = text.replace(args[0], `${args[0]} जी`);
  }

  return `${prefix}${text}`;
}

// --- 2. UPDATED FSM ---

export function nextTurn({
  state,
  borrower,
  text,
  tone = "neutral",
  convEntities = {},
}) {
  const {
    intent,
    entities: newEntities,
    sentiment,
  } = interpretUtterance({
    text,
    language: borrower.language,
  });

  const lang = borrower.language || "en";
  const bName = borrower.name.split(" ")[0]; // Use first name for a personal touch
  const bDue = borrower.amount_due || borrower.emi_amount;

  // Merge memory with new info
  const entities = {
    amount: newEntities.amount ?? convEntities.amount ?? null,
    due_date: newEntities.due_date ?? convEntities.due_date ?? null,
  };

  // CONTACT → VERIFY → INTENT → PLAN → RESOLVE
  if (state === "CONTACT") {
    return {
      nextState: "VERIFY",
      response: localize(lang, tone, sentiment, "VERIFY", bName),
      action: null,
      entities,
    };
  }

  if (state === "VERIFY") {
    if (intent === "CONFIRM" || intent === "CONSENT" || intent === "GREET") {
      return {
        nextState: "INTENT",
        response: localize(
          lang,
          tone,
          sentiment,
          "THANKS_AND_ASK",
          bName,
          bDue
        ),
        action: null,
        entities,
      };
    }
    return {
      nextState: "VERIFY",
      response: localize(lang, tone, sentiment, "VERIFY_FAIL", bName),
      action: null,
      entities,
    };
  }

  if (state === "INTENT") {
    if (intent === "ASK_DUE") {
      return {
        nextState: "INTENT",
        response: localize(lang, tone, sentiment, "ASK_DUE", bDue),
        action: null,
        entities,
      };
    }

    if (
      intent === "PTP_INTENT" ||
      intent === "PAY_INTENT" ||
      intent === "PAY_LATER"
    ) {
      const amount = entities.amount || bDue;
      const due = entities.due_date;

      if (due) {
        return {
          nextState: "PLAN",
          response: localize(
            lang,
            tone,
            sentiment,
            "PREVIEW_PTP",
            amount,
            new Date(due).toLocaleDateString("en-IN")
          ),
          action: "PTP_PREVIEW",
          entities: { amount, due_date: due },
        };
      } else {
        return {
          nextState: "INTENT",
          response: localize(lang, tone, sentiment, "ASK_PLAN"),
          action: null,
          entities,
        };
      }
    }

    if (intent === "HARDSHIP" || intent === "CANT_PAY") {
      return {
        nextState: "PLAN",
        response: localize(lang, tone, sentiment, "HARDSHIP_PLAN"),
        action: null,
        entities,
      };
    }

    if (intent === "CALLBACK") {
      return {
        nextState: "RESOLVE",
        response: localize(lang, tone, sentiment, "CALLBACK"),
        action: "SCHEDULE_CALLBACK",
        entities,
      };
    }

    return {
      nextState: "INTENT",
      response: localize(lang, tone, sentiment, "ASK_AGAIN"),
      action: null,
      entities,
    };
  }

  if (state === "PLAN") {
    if (intent === "CONFIRM" || intent === "PTP_INTENT") {
      const amount = entities.amount || bDue;
      const due = entities.due_date || new Date(Date.now() + 3 * 86400000);

      if (!entities.due_date) {
        return {
          nextState: "PLAN",
          response: localize(lang, tone, sentiment, "PLAN_MISSING_DATE"),
          action: null,
          entities,
        };
      }

      return {
        nextState: "RESOLVE",
        response: localize(
          lang,
          tone,
          sentiment,
          "CONFIRM_PTP",
          amount,
          new Date(due).toLocaleDateString("en-IN")
        ),
        action: "CREATE_PTP",
        entities: { amount, due_date: due },
      };
    }

    if (intent === "ASK_DUE") {
      return {
        nextState: "PLAN",
        response: localize(lang, tone, sentiment, "ASK_DUE", bDue),
        action: null,
        entities,
      };
    }

    if (intent === "CALLBACK") {
      return {
        nextState: "RESOLVE",
        response: localize(lang, tone, sentiment, "CALLBACK"),
        action: "SCHEDULE_CALLBACK",
        entities,
      };
    }

    if (intent === "HARDSHIP") {
      return {
        nextState: "PLAN",
        response: localize(lang, tone, sentiment, "HARDSHIP_PLAN"),
        action: null,
        entities,
      };
    }

    return {
      nextState: "PLAN",
      response: localize(lang, tone, sentiment, "PLAN_AGAIN"),
      action: null,
      entities,
    };
  }

  return {
    nextState: "RESOLVE",
    response: localize(lang, tone, sentiment, "RESOLVE"),
    action: null,
    entities,
  };
}
