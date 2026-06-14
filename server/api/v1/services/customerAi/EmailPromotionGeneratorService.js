import { callLlmJson, withSource } from "../ai/llmClient.js";

export class EmailPromotionGeneratorService {
  generateHeuristic({
    customerName = "",
    promotion = {},
    lang = "it",
  }) {
    const name = customerName.trim() || (lang === "en" ? "Customer" : "Cliente");
    const discount = promotion.discountPercent || 10;
    const product = promotion.productName || "prodotti selezionati";
    const validDays = promotion.validDays || 7;
    const motivation = promotion.motivation || "";

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + validDays);
    const dateStr = validUntil.toLocaleDateString(lang === "en" ? "en-GB" : "it-IT");

    const subject =
      lang === "en"
        ? `Exclusive ${discount}% offer for you`
        : `Promo esclusiva ${discount}% per lei`;

    const body =
      lang === "en"
        ? `Dear ${name},\n\nThank you for your recent purchases.\n\nBased on your preferences, we selected an offer that may interest you: ${discount}% off on ${product}, valid for ${validDays} days (until ${dateStr}).\n\n${motivation}\n\nWe remain at your disposal.\n\nBest regards,\nWorkHub Store Team`
        : `Gentile ${name},\n\nLa ringraziamo per i recenti acquisti.\n\nIn base ai prodotti scelti negli ultimi mesi abbiamo selezionato una proposta dedicata: ${discount}% di sconto su ${product}, valida per ${validDays} giorni (fino al ${dateStr}).\n\n${motivation}\n\nRestiamo a disposizione per qualsiasi informazione.\n\nCordiali saluti,\nTeam WorkHub`;

    return { subject, body };
  }

  async generate({ customerName, promotion, lang = "it" }) {
    const language = lang === "en" ? "English" : "Italian";

    const systemPrompt = `Genera email promo B2C professionale per WorkHub.
Lingua: ${language}.
Rispondi SOLO con JSON: { "subject": "...", "body": "..." }`;

    const llmResult = await callLlmJson({
      systemPrompt,
      userPrompt: JSON.stringify({ customerName, promotion, lang }),
    });

    if (llmResult?.subject && llmResult?.body) {
      return withSource(
        { subject: llmResult.subject, body: llmResult.body },
        "ai"
      );
    }

    return withSource(
      this.generateHeuristic({ customerName, promotion, lang }),
      "heuristic"
    );
  }
}
