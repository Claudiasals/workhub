import { callLlmJson, withSource } from "../../ai/llmClient.js";

const PROVIDER_NAME = "ai";

export class LlmTicketInsightsProvider {
  get name() {
    return PROVIDER_NAME;
  }

  async analyze(tickets = []) {
    const compact = tickets.slice(0, 120).map((ticket) => ({
      name: ticket.name,
      status: ticket.status,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      category: ticket.aiClassification?.category,
      priority: ticket.aiClassification?.priority,
      user: ticket.user?.firstName
        ? `${ticket.user.firstName} ${ticket.user.lastName || ""}`.trim()
        : undefined,
      department: ticket.user?.department,
    }));

    const systemPrompt = `Sei un analista operativo WorkHub per ticket interni aziendali.
Analizza i dati e genera alert (criticità) e insight (osservazioni utili) per un responsabile.
Rispondi SOLO con JSON valido:
{
  "alerts": [
    { "type": "critical|warning|info", "title": "stringa breve", "description": "azione consigliata" }
  ],
  "insights": [
    { "type": "info", "title": "stringa breve", "description": "interpretazione utile" }
  ]
}
Regole:
- alerts: massimo 6, focus su ritardi, priorità alta, picchi categoria, sovraccarico dipendenti
- insights: massimo 6, trend, tempi risoluzione, sedi, pattern settimanali
- testi in italiano, concreti, con numeri quando possibile`;

    const llmResult = await callLlmJson({
      systemPrompt,
      userPrompt: JSON.stringify({ tickets: compact, total: tickets.length }),
    });

    if (
      Array.isArray(llmResult?.alerts) &&
      Array.isArray(llmResult?.insights) &&
      (llmResult.alerts.length > 0 || llmResult.insights.length > 0)
    ) {
      return withSource(
        {
          alerts: llmResult.alerts.slice(0, 8),
          insights: llmResult.insights.slice(0, 8),
        },
        PROVIDER_NAME
      );
    }

    return null;
  }
}
