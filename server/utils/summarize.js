// Lightweight “AI-style” call summary from conversation turns + audit
export function summarizeConversation(conv) {
  const lines = conv.turns || [];
  const lastAgent =
    [...lines].reverse().find((t) => t.role === "agent")?.text || "";
  const borrowerSays = lines
    .filter((t) => t.role === "borrower")
    .slice(-3)
    .map((t) => t.text);
  const hasPTP = conv.audit?.some((a) => a.type === "PTP_CREATED");
  const hasWA = conv.audit?.some((a) => a.type === "WHATSAPP_CONFIRM_SENT");

  const summary = [];
  summary.push(`Channel: ${conv.channel} • Tone: ${conv.tone}`);
  if (borrowerSays.length)
    summary.push(`Borrower said: “${borrowerSays.join("” | “")}”`);
  summary.push(`Agent final: “${lastAgent}”`);
  if (hasPTP) summary.push("Outcome: Promise-to-Pay created.");
  if (hasWA) summary.push("Follow-up: WhatsApp confirmation sent.");
  return summary.join("\n");
}
