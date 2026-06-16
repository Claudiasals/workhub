import { warehouseSuggestionsHeuristic, analyzeShiftsHeuristic } from "../ai/heuristics.js";
import {
  daysSince,
  groupOrdersByProductLocation,
  ordersInRange,
  percentChange,
  sumRevenue,
  getOrderRevenue,
} from "../dashboardAi/analyzeDashboardData.js";

const MS_DAY = 24 * 60 * 60 * 1000;

const ROUTES = {
  magazzino: "/warehouse",
  ticket: "/ticket",
  vendite: "/orders",
  clienti: "/customers",
  turni: "/personale",
};

function item(type, area, title, description, actionLabel) {
  return {
    type,
    area,
    title,
    description,
    actionLabel,
    targetRoute: ROUTES[area],
  };
}

function severityToType(severity) {
  if (severity === "high") return "critical";
  if (severity === "medium") return "warning";
  return "info";
}

function getItemStock(item) {
  if (item.stock != null && typeof item.stock === "object") {
    const values = Object.values(item.stock);
    return Math.min(...values.map((v) => Number(v) || 0));
  }
  return Number(item.stock ?? 0);
}

function getLocationName(item) {
  return item.pointOfSales?.name || item.pointOfSales?.city || "Sede";
}

function groupLowStockByLocation(items) {
  const map = new Map();
  items.forEach((item) => {
    const stock = getItemStock(item);
    const limit = Number(item.stockLimit ?? 0);
    if (stock > limit) return;
    const loc = getLocationName(item);
    map.set(loc, (map.get(loc) || 0) + 1);
  });
  return map;
}

function groupOrdersByCategory(orders) {
  const map = new Map();
  orders.forEach((order) => {
    const cat =
      order.product?.category?.name ||
      order.product?.category ||
      "Senza categoria";
    if (!map.has(cat)) map.set(cat, { count: 0, revenue: 0 });
    const row = map.get(cat);
    row.count += 1;
    row.revenue += getOrderRevenue(order);
  });
  return map;
}

export class BusinessOverviewService {
  generate({
    items = [],
    orders = [],
    tickets = [],
    shifts = [],
    leaves = [],
    users = [],
  }) {
    const alerts = [];
    const insights = [];
    const now = new Date();

    const lowByLocation = groupLowStockByLocation(items);
    lowByLocation.forEach((count, loc) => {
      alerts.push(
        item(
          count >= 4 ? "critical" : "warning",
          "magazzino",
          `Stock critico: ${count} prodott${count === 1 ? "o" : "i"} sotto soglia`,
          `${count} articol${count === 1 ? "o" : "i"} sotto soglia nella sede di ${loc}.`,
          "Vai al magazzino"
        )
      );
    });

    const warehouseSuggestions = warehouseSuggestionsHeuristic(items, orders);
    const reorderCount = warehouseSuggestions.suggestions.filter(
      (s) => s.type === "reorder"
    ).length;
    if (reorderCount > 0 && alerts.length === 0) {
      alerts.push(
        item(
          "critical",
          "magazzino",
          `${reorderCount} prodott${reorderCount === 1 ? "o" : "i"} da riordinare urgentemente`,
          "Uno o più articoli risultano esauriti o sotto soglia minima.",
          "Vai al magazzino"
        )
      );
    }

    const openTickets = tickets.filter((t) => t.status === "open");
    const stale7 = openTickets.filter(
      (t) => daysSince(t.createdAt || t.updatedAt) >= 7
    );
    const urgentStale = stale7.filter(
      (t) => t.aiClassification?.priority === "alta"
    );

    if (urgentStale.length > 0) {
      alerts.push(
        item(
          "critical",
          "ticket",
          `${urgentStale.length} ticket ad alta priorità aperti da oltre 7 giorni`,
          "Priorità alta non risolta: richiedono intervento immediato del responsabile.",
          "Apri ticket"
        )
      );
    } else if (stale7.length > 0) {
      alerts.push(
        item(
          stale7.length >= 3 ? "critical" : "warning",
          "ticket",
          `${stale7.length} ticket aperti da oltre 7 giorni`,
          "Ticket in sospeso che richiedono risoluzione da parte del responsabile.",
          "Apri ticket"
        )
      );
    }

    const urgentOpen = openTickets.filter(
      (t) => t.aiClassification?.priority === "alta"
    );
    if (urgentOpen.length > 0 && urgentStale.length === 0) {
      alerts.push(
        item(
          "warning",
          "ticket",
          `${urgentOpen.length} ticket urgenti ancora aperti`,
          "Priorità alta assegnata dall'AI: intervenire tempestivamente.",
          "Apri ticket"
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
        item(
          revChange <= -25 ? "critical" : "warning",
          "vendite",
          `Vendite in calo del ${Math.abs(revChange)}%`,
          `Ultimi 30 giorni: €${Math.round(revLast)} vs €${Math.round(revPrev)} nel periodo precedente.`,
          "Vedi vendite"
        )
      );
    }

    const lastCat = groupOrdersByCategory(last30Orders);
    const prevCat = groupOrdersByCategory(prev30Orders);
    lastCat.forEach((recent, catName) => {
      const previous = prevCat.get(catName);
      const prevRev = previous?.revenue || 0;
      if (prevRev >= 100) {
        const change = percentChange(recent.revenue, prevRev);
        if (change <= -15) {
          insights.push(
            item(
              "info",
              "vendite",
              `Calo categoria ${catName}`,
              `Le vendite della categoria ${catName} sono diminuite del ${Math.abs(change)}% rispetto al mese scorso.`,
              "Vedi vendite"
            )
          );
        }
      }
    });

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
          item(
            "info",
            "vendite",
            `Calo vendite: ${recent.productName} a ${recent.posName}`,
            `Acquisti -${Math.abs(change)}% rispetto ai 90 giorni precedenti. Valutare se il prodotto è poco adatto alla sede.`,
            "Vedi vendite"
          )
        );
      }
    });

    prevMap.forEach((previous, key) => {
      if (!recentMap.has(key) && previous.count >= 2) {
        insights.push(
          item(
            "warning",
            "vendite",
            `${previous.productName} non venduto a ${previous.posName}`,
            `Il prodotto "${previous.productName}" non viene acquistato nella sede di ${previous.posName} da 90 giorni. Valutare se mantenerlo in assortimento o sostituirlo con prodotti più adatti al pubblico locale.`,
            "Vedi vendite"
          )
        );
      }
    });

    const posDemand = new Map();
    ordersInRange(orders, last90Start, now).forEach((order) => {
      const posName =
        order.pointOfSales?.name ||
        order.pointOfSales?.city ||
        "Sede";
      const cat =
        order.product?.category?.name ||
        order.product?.category ||
        "Generale";
      const key = `${posName}::${cat}`;
      posDemand.set(key, (posDemand.get(key) || 0) + 1);
    });

    const avgByCat = new Map();
    posDemand.forEach((count, key) => {
      const cat = key.split("::")[1];
      if (!avgByCat.has(cat)) avgByCat.set(cat, []);
      avgByCat.get(cat).push(count);
    });

    posDemand.forEach((count, key) => {
      const [posName, cat] = key.split("::");
      const peers = avgByCat.get(cat) || [];
      if (peers.length < 2) return;
      const avg = peers.reduce((s, v) => s + v, 0) / peers.length;
      if (count >= avg * 1.4 && count >= 3) {
        insights.push(
          item(
            "success",
            "vendite",
            `Domanda elevata a ${posName}`,
            `La sede di ${posName} registra una richiesta superiore alla media per articoli di categoria ${cat}.`,
            "Vedi vendite"
          )
        );
      }
    });

    const transferHints = warehouseSuggestions.suggestions.filter(
      (s) => s.type === "transfer"
    );
    if (transferHints.length > 0) {
      insights.push(
        item(
          "info",
          "magazzino",
          "Anomalia stock tra sedi",
          transferHints[0].message,
          "Vai al magazzino"
        )
      );
    }

    const shiftAnalysis =
      shifts.length > 0
        ? analyzeShiftsHeuristic(shifts, leaves, users)
        : { alerts: [], coverage: {} };

    shiftAnalysis.alerts
      .filter((a) => a.type !== "ok")
      .slice(0, 4)
      .forEach((a) => {
        const isCritical = a.severity === "high" || a.type === "gap";
        alerts.push(
          item(
            isCritical ? "critical" : "warning",
            "turni",
            a.type === "gap" ? "Copertura turni insufficiente" : "Alert turni",
            a.message,
            "Controlla turni"
          )
        );
      });

    const dayIndex = (now.getDay() + 6) % 7;
    const dayKeys = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    const todayKey = dayKeys[dayIndex];
    if (todayKey === "friday") {
      const friCov = shiftAnalysis.coverage?.friday;
      if (friCov && friCov.mid <= 1 && friCov.late <= 1) {
        insights.push(
          item(
            "warning",
            "turni",
            "Venerdì: copertura serale ridotta",
            "Venerdì nelle fasce 12-18 e 17-22 risultano pochi dipendenti assegnati rispetto alla media delle vendite.",
            "Controlla turni"
          )
        );
      }
    }

    const balancedLocations = new Set(
      items
        .filter((i) => getItemStock(i) > Number(i.stockLimit ?? 0))
        .map((i) => getLocationName(i))
    );
    if (balancedLocations.size >= 2 && shiftAnalysis.alerts.some((a) => a.type === "ok")) {
      insights.push(
        item(
          "success",
          "turni",
          "Copertura turni nella norma",
          "La pianificazione settimanale non presenta criticità immediate sulle fasce principali.",
          "Controlla turni"
        )
      );
    }

    if (alerts.length === 0) {
      alerts.push(
        item(
          "info",
          "vendite",
          "Nessuna criticità immediata",
          "Operatività nella norma sui dati analizzati.",
          undefined
        )
      );
    }

    if (insights.length === 0) {
      insights.push(
        item(
          "info",
          "vendite",
          "Panoramica operativa",
          "Continua a monitorare vendite, magazzino, ticket e turni per decisioni tempestive.",
          undefined
        )
      );
    }

    return {
      alerts: alerts.slice(0, 10),
      insights: insights.slice(0, 10),
      source: "heuristic",
      generatedAt: now.toISOString(),
    };
  }
}
