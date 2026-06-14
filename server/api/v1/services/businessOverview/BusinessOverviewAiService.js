import { callLlmJson, isAiConfigured } from "../ai/llmClient.js";
import { BusinessOverviewService } from "./BusinessOverviewService.js";

export class BusinessOverviewAiService {
  constructor() {
    this.heuristic = new BusinessOverviewService();
  }

  async getBusinessOverview(payload) {
    const base = this.heuristic.generate(payload);

    if (!isAiConfigured()) return base;

    const llmResult = await callLlmJson({
      systemPrompt: `Sei un analista operativo WorkHub. Genera alert e insight trasversali per la dashboard aziendale.
Rispondi SOLO con JSON:
{
  "alerts": [{ "type": "critical|warning|info|success", "area": "magazzino|ticket|vendite|clienti|turni", "title": "...", "description": "...", "actionLabel": "...", "targetRoute": "..." }],
  "insights": [{ "type": "info", "area": "...", "title": "...", "description": "...", "actionLabel": "...", "targetRoute": "..." }]
}
Max 8 alert e 8 insight. Italiano. Usa i dati forniti. Includi actionLabel e targetRoute quando pertinente.`,
      userPrompt: JSON.stringify({
        sampleAlerts: base.alerts.slice(0, 4),
        sampleInsights: base.insights.slice(0, 4),
        stats: {
          items: payload.items?.length,
          orders: payload.orders?.length,
          openTickets: payload.tickets?.filter((t) => t.status === "open").length,
          shifts: payload.shifts?.length,
        },
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

export function getBusinessOverviewService() {
  if (!instance) instance = new BusinessOverviewAiService();
  return instance;
}

export async function getBusinessOverview(payload) {
  return getBusinessOverviewService().getBusinessOverview(payload);
}
