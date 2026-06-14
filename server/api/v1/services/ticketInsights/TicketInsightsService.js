import { isAiConfigured } from "../ai/llmClient.js";
import { HeuristicTicketInsightsProvider } from "./providers/HeuristicTicketInsightsProvider.js";
import { LlmTicketInsightsProvider } from "./providers/LlmTicketInsightsProvider.js";

/**
 * Orchestrates ticket insight generation.
 * Tries LLM provider first when configured, falls back to heuristic rules.
 */
export class TicketInsightsService {
  constructor({ providers } = {}) {
    this.providers =
      providers ||
      (isAiConfigured()
        ? [new LlmTicketInsightsProvider(), new HeuristicTicketInsightsProvider()]
        : [new HeuristicTicketInsightsProvider()]);
  }

  async analyze(tickets = []) {
    for (const provider of this.providers) {
      const result = await provider.analyze(tickets);
      if (result?.alerts?.length || result?.insights?.length) {
        return result;
      }
    }

    return {
      alerts: [],
      insights: [],
      source: "heuristic",
      generatedAt: new Date().toISOString(),
    };
  }
}

let defaultService;

export function createTicketInsightsService(options) {
  return new TicketInsightsService(options);
}

export function getTicketInsightsService() {
  if (!defaultService) {
    defaultService = createTicketInsightsService();
  }
  return defaultService;
}

export async function getTicketInsights({ tickets = [] }) {
  return getTicketInsightsService().analyze(tickets);
}

export { HeuristicTicketInsightsProvider, LlmTicketInsightsProvider };
