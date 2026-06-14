import { warehouseSuggestionsHeuristic } from "../ai/heuristics.js";
import {
  daysSince,
  groupOrdersByProductLocation,
  ordersInRange,
  percentChange,
  sumRevenue,
} from "./analyzeDashboardData.js";

const MS_DAY = 24 * 60 * 60 * 1000;

function mapSeverity(severity) {
  if (severity === "high") return "critical";
  if (severity === "medium") return "warning";
  return "info";
}

function alert(type, title, description) {
  return { type, title, description };
}

function insight(title, description) {
  return { type: "info", title, description };
}

export class DashboardInsightsService {
  generate({ items = [], orders = [], tickets = [] }) {
    const alerts = [];
    const insights = [];
    const now = new Date();

    const warehouseSuggestions = warehouseSuggestionsHeuristic(items, orders);
    warehouseSuggestions.suggestions
      .filter((s) => s.type !== "ok")
      .slice(0, 5)
      .forEach((s) => {
        alerts.push(
          alert(
            mapSeverity(s.severity),
            s.type === "reorder" ? "Riordino urgente" : "Magazzino",
            s.message
          )
        );
      });

    const openTickets = tickets.filter((t) => t.status === "open");
    const stale7 = openTickets.filter((t) =>
      daysSince(t.createdAt || t.updatedAt) >= 7
    );
    if (stale7.length > 0) {
      alerts.push(
        alert(
          stale7.length >= 3 ? "critical" : "warning",
          `${stale7.length} ticket aperti da oltre 7 giorni`,
          "Ticket in sospeso che richiedono risoluzione da parte del responsabile."
        )
      );
    }

    const urgentOpen = openTickets.filter(
      (t) => t.aiClassification?.priority === "alta"
    );
    if (urgentOpen.length > 0) {
      alerts.push(
        alert(
          "warning",
          `${urgentOpen.length} ticket urgenti ancora aperti`,
          "Priorità alta assegnata dall'AI: intervenire tempestivamente."
        )
      );
    }

    const last30Start = new Date(now.getTime() - 30 * MS_DAY);
    const prev30Start = new Date(now.getTime() - 60 * MS_DAY);
    const last30Orders = ordersInRange(orders, last30Start, now);
    const prev30Orders = ordersInRange(orders, prev30Start, last30Start);
    const revLast = sumRevenue(last30Orders);
    const revPrev = sumRevenue(prev30Orders);
    const revChange = percentChange(revLast, revPrev);

    if (revPrev > 0 && revChange <= -15) {
      alerts.push(
        alert(
          revChange <= -25 ? "critical" : "warning",
          `Vendite in calo del ${Math.abs(revChange)}%`,
          `Ultimi 30 giorni: €${Math.round(revLast)} vs €${Math.round(revPrev)} nel periodo precedente.`
        )
      );
    } else if (revLast > 0) {
      insights.push(
        insight(
          "Andamento vendite",
          revChange >= 0
            ? `Fatturato ultimi 30 giorni €${Math.round(revLast)} (+${revChange}% vs mese precedente).`
            : `Fatturato ultimi 30 giorni €${Math.round(revLast)} (${revChange}% vs mese precedente).`
        )
      );
    }

    const last90Start = new Date(now.getTime() - 90 * MS_DAY);
    const prev90Start = new Date(now.getTime() - 180 * MS_DAY);
    const recent90 = ordersInRange(orders, last90Start, now);
    const prev90 = ordersInRange(orders, prev90Start, last90Start);
    const recentMap = groupOrdersByProductLocation(recent90);
    const prevMap = groupOrdersByProductLocation(prev90);

    recentMap.forEach((recent, key) => {
      const previous = prevMap.get(key);
      const prevCount = previous?.count || 0;
      const change = percentChange(recent.count, prevCount);

      if (prevCount >= 3 && change <= -40) {
        insights.push(
          insight(
            `Calo vendite: ${recent.productName} a ${recent.posName}`,
            `Acquisti -${Math.abs(change)}% rispetto ai 90 giorni precedenti. Valutare se il prodotto è poco adatto alla sede (contesto locale, domanda, assortimento).`
          )
        );
      }
    });

    const lowStockCount = items.filter(
      (i) => Number(i.stock ?? 0) <= Number(i.stockLimit ?? 0)
    ).length;
    if (lowStockCount > 0) {
      insights.push(
        insight(
          "Monitoraggio scorte",
          `${lowStockCount} articol${lowStockCount === 1 ? "o" : "i"} sotto soglia in magazzino.`
        )
      );
    }

    if (openTickets.length > 0) {
      insights.push(
        insight(
          "Backlog ticket",
          `${openTickets.length} ticket aperti nel sistema.`
        )
      );
    }

    if (alerts.length === 0) {
      alerts.push(
        alert("info", "Nessuna criticità immediata", "Operatività nella norma sui dati analizzati.")
      );
    }

    if (insights.length === 0) {
      insights.push(
        insight(
          "Panoramica operativa",
          "Continua a monitorare vendite, magazzino e ticket per decisioni tempestive."
        )
      );
    }

    return {
      alerts: alerts.slice(0, 8),
      insights: insights.slice(0, 8),
      source: "heuristic",
      generatedAt: now.toISOString(),
    };
  }
}
