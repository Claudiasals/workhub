import { ordersInLastMonths } from "./analyzeCustomerData.js";

export class CustomerInsightsService {
  generate({ metrics, globalAverageOrderValue = null }) {
    const insights = [];
    const { normalized, preferredCategory, totalOrders, averageOrderValue, topLocation } =
      metrics;

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

    if (
      globalAverageOrderValue &&
      averageOrderValue > globalAverageOrderValue * 1.1
    ) {
      insights.push({
        type: "info",
        title: "Valore ordine sopra la media",
        description: `Il valore medio degli ordini (€${averageOrderValue}) è superiore alla media clienti (€${Math.round(globalAverageOrderValue)}).`,
      });
    } else if (averageOrderValue > 0) {
      insights.push({
        type: "info",
        title: "Valore medio ordine",
        description: `Spesa media per ordine: €${averageOrderValue}.`,
      });
    }

    const sortedCats = Object.entries(metrics.categoryCounts).sort(
      (a, b) => b[1] - a[1]
    );
    if (sortedCats.length > 1 && sortedCats[1][1] >= 2) {
      insights.push({
        type: "info",
        title: "Interesse secondario",
        description: `Acquista frequentemente anche prodotti ${sortedCats[1][0]}.`,
      });
    }

    if (preferredCategory && preferredCategory !== "N/D") {
      insights.push({
        type: "info",
        title: "Opportunità cross-selling",
        description: `Elevata probabilità di acquisti complementari per la categoria ${preferredCategory}.`,
      });
    }

    if (topLocation && topLocation !== "N/D") {
      insights.push({
        type: "info",
        title: "Sede frequente",
        description: `La maggior parte degli acquisti avviene presso ${topLocation}.`,
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
}
