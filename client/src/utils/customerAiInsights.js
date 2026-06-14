import { ordersInLastMonths } from "./customerAiMetrics.js";

export function buildCustomerInsights(metrics, globalAverageOrderValue = null) {
  const insights = [];
  const { normalized, preferredCategory, averageOrderValue, topLocation } = metrics;

  if (preferredCategory && preferredCategory !== "N/D") {
    insights.push({
      type: "info",
      title: "Categoria preferita",
      description: `Il cliente acquista prevalentemente prodotti nella categoria ${preferredCategory}.`,
    });
  }

  const last6 = ordersInLastMonths(normalized, 6);
  if (last6.length > 0) {
    insights.push({
      type: "info",
      title: "Attività recente",
      description: `Negli ultimi 6 mesi ha effettuato ${last6.length} acquist${last6.length === 1 ? "o" : "i"}.`,
    });
  }

  if (globalAverageOrderValue && averageOrderValue > globalAverageOrderValue * 1.1) {
    insights.push({
      type: "info",
      title: "Valore ordine sopra la media",
      description: `Valore medio €${averageOrderValue}, superiore alla media clienti.`,
    });
  } else if (averageOrderValue > 0) {
    insights.push({
      type: "info",
      title: "Valore medio ordine",
      description: `Spesa media per ordine: €${averageOrderValue}.`,
    });
  }

  if (topLocation && topLocation !== "N/D") {
    insights.push({
      type: "info",
      title: "Sede frequente",
      description: `Acquisti frequenti presso ${topLocation}.`,
    });
  }

  if (insights.length === 0) {
    insights.push({
      type: "info",
      title: "Storico limitato",
      description: "Servono più acquisti per insight commerciali approfonditi.",
    });
  }

  return insights;
}
