import { callLlmJson } from "../../ai/llmClient.js";

export class LlmCustomerAiProvider {
  async enhance({ customer, metrics, insights, promotions }) {
    const systemPrompt = `Sei un analista commerciale WorkHub. Migliora insight e promo per un cliente retail B2C.
Rispondi SOLO con JSON:
{
  "insights": [{ "type": "info", "title": "...", "description": "..." }],
  "promotions": [{
    "productName": "...", "discountPercent": 10, "validDays": 7,
    "motivation": "...", "recentProducts": []
  }]
}
Massimo 5 insight e 2 promo. Italiano. Usa i dati forniti, non inventare prodotti non in catalogo.`;

    const userPrompt = JSON.stringify({
      customer: {
        name: `${customer.firstName} ${customer.lastName}`,
        city: customer.location?.city,
        tier: metrics.tier,
        points: metrics.points,
      },
      metrics: {
        totalOrders: metrics.totalOrders,
        averageOrderValue: metrics.averageOrderValue,
        preferredCategory: metrics.preferredCategory,
        frequencyDays: metrics.frequencyDays,
      },
      currentInsights: insights,
      currentPromotions: promotions,
    });

    const result = await callLlmJson({ systemPrompt, userPrompt });
    if (!result) return null;
    return result;
  }
}
