# Riverline: AI-Powered Voice Collections Agent

### A Full-Stack AI Application by [Srikurmadasu Praneeth]

This project is a high-fidelity, production-ready prototype of an AI-powered collections system, built in a 48-hour sprint in response to the Full-stack AI Engineer role at Riverline.

It demonstrates a "founder mode" and "ships by tonight" mindset, moving from a job description to a fully deployed application. The system is an "AI-first" OS designed to manage, prioritize, and automate conversations with borrowers, complete with multilingual support, live telephony, and BFSI-grade compliance.

**Live Demo:**

- **Frontend (Vercel):** [https://riverline-voice-agent-j2np-8dhxpjmv9.vercel.app/](https://riverline-voice-agent-j2np-8dhxpjmv9.vercel.app/)
- **Backend (Render):** [https://riverline-voice-agent.onrender.com](https://riverline-voice-agent.onrender.com)

---

## ✨ Core Features

This application is built around 10 core modules that simulate a complete, enterprise-grade recovery OS.

### 1. 🧠 Borrower Intelligence & Scoring (Core Engine)

A dynamic scoring engine that analyzes borrowers in real-time.

- **Dynamic DPD Calculation:** Accurately calculates Days Past Due (DPD), a critical metric for compliance and priority.
- **Risk Level Mapping:** Automatically segments borrowers into **High, Medium,** or **Low** risk tiers.
- **Behavioral Personas:** Classifies borrowers as `neutral`, `friendly`, `avoider`, `aggressive`, or `distressed` based on their history.
- **Penalty Tracking:** Increments a `broken_ptp` (Promise-to-Pay) counter for each missed promise, directly impacting their risk score.

### 2. 📈 Recovery Prioritization Engine

Ensures the AI agent _always_ calls the most valuable or high-risk borrower first.

- **Scientific `buildQueue`:** Sorts all borrowers by a dynamic **Priority Score** calculated from DPD, risk, persona, and recent call outcomes.
- **Operator Triage:** The UI includes filters for `High`, `Medium`, and `Low` risk, allowing operators to segment the queue.

### 3. 🤖 Multilingual Voice AI System

The core of the "AI-first" operating system.

- **Multilingual NLU:** The AI understands and parses amounts, dates, and intents (like "I can't pay," "How much do I owe?") across **English, Hindi, and Telugu**.
- **Stateful FSM:** A robust Finite State Machine manages the conversation flow from greeting and verification (e.g., "Am I speaking to Vikram?") to negotiation and confirmation.
- **Automated Negotiation:** The AI can autonomously detect a `PTP_INTENT`, parse the amount/date, and create a formal Promise-to-Pay.
- **Dynamic Localization:** The agent automatically speaks in the borrower's preferred language, using respectful honorifics (e.g., "**ji**" in Hindi, "**garu**" in Telugu) to build trust.
- **Empathy & Tone Switching:** The agent detects hardship or negative sentiment and automatically switches to an empathetic tone (e.g., "I understand...").
- **LLM Suggestion Layer:** An integrated OpenAI (`gpt-3.5-turbo`) layer provides real-time "LLM Suggestions" in the coaching panel to help the agent deliver a more persuasive, natural reply.

### 4. 💸 Payment & Promise (PTP) Management

Manages the full lifecycle of a borrower's commitment.

- **Payment Simulation:** A `collectPayment` endpoint that correctly applies funds, handles partial payments, and advances the borrower's `next_due_date` only when a full EMI is paid.
- **PTP Lifecycle:** Full API flows to create, mark `KEPT`, or mark `BROKEN` promises, which automatically updates the borrower's `active_ptp` status and risk score.

### 5. ⚖️ Settlement & Discount Engine

An automated system for last-mile recovery.

- **Smart Recommendations:** An endpoint that recommends an optimal settlement discount percentage based on the borrower's DPD.
- **Offer Lifecycle:** Full API flows to create, list, and accept settlement offers, which updates the borrower's `active_offer` flag to de-prioritize them from the call queue.

### 6. 🛡️ BFSI-Grade Compliance & Risk Controls

Enterprise-grade safety features built directly into the workflow.

- **Abuse Detection:** Automatically detects abusive or harassing language during a call.
- **Auto Safe Mode:** When abuse is detected, the call is immediately terminated, the borrower's account is flagged (`safe_mode_flag`), and they are locked from all future automated outreach.
- **Legal Escalation:** The system tracks broken promises and automatically flags accounts for legal review (`legal_escalation_flag`) after a set threshold (e.g., 3 broken promises).
- **RBI Quiet Hours:** A compliance check automatically blocks call initiation outside of the legally mandated 8 AM - 8 PM IST window.
- **Fake Number Detection:** A utility (`detectFakeNumber`) flags and de-prioritizes numbers that are clearly invalid (e.g., `9999999999`, `1234567890`).

### 7. 🌐 Cultural & Language UX

This is the localization layer that makes the AI effective.

- The entire agent script is stored in a `translations` object.
- The FSM dynamically pulls `en`, `hi`, or `te` scripts based on the `borrower.language` field, ensuring a natural, respectful conversation.

### 8. 📊 Operations Dashboard (CFO + Ops View)

A dedicated `/reports` page for a high-level executive summary.

- **Risk Distribution:** A chart showing the real-time mix of High, Medium, and Low risk borrowers in the portfolio.
- **Expected Recovery:** A predictive model shows the expected recovery amount for each borrower over the next 7 and 30 days.
- **Live Outcome Counters:** Tracks all call outcomes (Connected, No Answer, Busy, PTP Created) for performance monitoring.
- **Predictive Contact Model:** A simple heuristic model (`bestContactTimeIST`) analyzes past "connected" calls to recommend the best time of day to contact a specific borrower.

### 9. 📞 Telephony & Automation (Twilio Integration)

The system is fully wired for real-world communication.

- **Live Call Pipeline (ASR/TTS):** A "Live Call" button places a real, end-to-end phone call via Twilio. The backend `twilioController` handles the TwiML webhooks, using Twilio's ASR (Speech-to-Text) to listen and TTS (Text-to-Speech) to speak, with the entire conversation driven by the FSM.
- **WhatsApp Bot:** The settlement negotiation system is integrated with the Twilio WhatsApp API. When an agent creates a settlement offer, it is **automatically sent to the borrower's WhatsApp**.
- **Auto-Followup:** An endpoint to schedule a future `follow_up_at` time, which can be used to trigger future calls or messages.

### 10. 🗂️ AI Safety & EOD Ops

Provides final layers of traceability and intelligence.

- **EOD Report:** A `GET /api/reports/eod` endpoint that generates a JSON summary of all totals and conversion rates for the day.
- **Complete Audit Trail:** Every significant event (call start, PTP creation, WA sent, abuse detected, Twilio CallSid) is logged in the `Conversation` or `Settlement` models for full compliance traceability.

---

## 💻 Tech Stack

- **Frontend:** React.js, React Router, Bootstrap
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (Atlas)
- **Telephony & Messaging:** Twilio (Programmable Voice, ASR/TTS, WhatsApp API)
- **AI / LLM:** OpenAI (GPT-3.5)
- **Deployment:** Vercel (Frontend), Render (Backend)
