// server/utils/openai.js
import OpenAI from "openai";
import { config } from "../config.js";

const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

/**
 * Generates an optimized, policy-safe reply suggestion from an LLM.
 * @param {object} conversation - The full conversation object.
 * @param {string} lastBorrowerText - The last thing the borrower said.
 * @param {string} fsmReply - The default reply from the FSM.
 * @returns {string | null} - The LLM's suggestion, or null if it fails.
 */
export async function getLLMSuggestion(
  conversation,
  lastBorrowerText,
  fsmReply
) {
  try {
    const turns = conversation.turns
      .slice(-4)
      .map((t) => `${t.role}: ${t.text}`)
      .join("\n");
    const context = `
      Current conversation state: ${conversation.state}
      Borrower's last message: "${lastBorrowerText}"
      Your default (FSM) reply is: "${fsmReply}"
      
      Conversation history (last 4 turns):
      ${turns}
    `;

    const prompt = `
      You are an expert collections agent for Riverline, an AI-first bank.
      Your goal is to secure a Promise-to-Pay (PTP) while being empathetic and compliant.
      
      Context:
      ${context}

      Task:
      Based on the context, refine the "default reply" to be more persuasive, empathetic, and natural.
      - If the default reply is good, just repeat it.
      - If the borrower is showing hardship (e.g., "lost job", "medical issue"), be extra empathetic.
      - If the borrower is confirming a plan, be clear and confirm the details.
      - DO NOT suggest any specific amounts or dates not already mentioned.
      - Keep the reply concise (1-2 sentences).
      
      Refined Reply:
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Use gpt-4 for better quality if available
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      max_tokens: 60,
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error("OpenAI API error:", error.message);
    return null; // Don't block the conversation if LLM fails
  }
}
