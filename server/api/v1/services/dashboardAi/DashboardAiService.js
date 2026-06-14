import { callLlmJson, isAiConfigured } from "../ai/llmClient.js";
import { DashboardInsightsService } from "./DashboardInsightsService.js";

export class DashboardAiService {
  constructor() {
    this.heuristic = new DashboardInsightsService();
  }

  async getDashboardInsights({ items, orders, tickets }) {
    const base = this.heuristic.generate({ items, orders, tickets });

    if (!isAiConfigured()) return base;

    const llmResult = await callLlmJson({
      systemPrompt: `Sei un analista operativo WorkHub. Genera alert e insight trasversali (magazzino, ticket, vendite, sedi).
Rispondi SOLO con JSON:
{
  "alerts": [{ "type": "critical|warning|info", "title": "...", "description": "..." }],
  "insights": [{ "type": "info", "title": "...", "description": "..." }]
}
Max 6 alert e 6 insight. Italiano. Usa i dati forniti.`,
      userPrompt: JSON.stringify({
        warehouseAlertCount: base.alerts.filter((a) =>
          /magazzino|riordino|stock|esaurito/i.test(a.description)
        ).length,
        ticketStale: tickets.filter((t) => t.status === "open").length,
        orderCount: orders.length,
        sampleAlerts: base.alerts.slice(0, 3),
        sampleInsights: base.insights.slice(0, 3),
      }),
    });

    if (llmResult?.alerts?.length || llmResult?.insights?.length) {
      return {
        alerts: llmResult.alerts?.length ? llmResult.alerts : base.alerts,
        insights: llmResult.insights?.length ? llmResult.insights : base.insights,
        source: "ai",
        generatedAt: new Date().toISOString(),
      };
    }

    return base;
  }
}

let instance;

export function getDashboardAiService() {
  if (!instance) instance = new DashboardAiService();
  return instance;
}

export async function getDashboardInsights(payload) {
  return getDashboardAiService().getDashboardInsights(payload);
}
