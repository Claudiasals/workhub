import {
  avgResolutionByCategory,
  avgResolutionDays,
  categoryLabel,
  countByCategory,
  daysBetween,
  detectLocation,
  normalizeTickets,
  percentChange,
  ticketsInRange,
  weekdayDistribution,
} from "../analyzeTicketData.js";

const PROVIDER_NAME = "heuristic";

function alert(type, title, description) {
  return { type, title, description };
}

function insight(title, description) {
  return { type: "info", title, description };
}

export class HeuristicTicketInsightsProvider {
  get name() {
    return PROVIDER_NAME;
  }

  async analyze(tickets = []) {
    const normalized = normalizeTickets(tickets);
    const now = new Date();
    const last30Start = new Date(now.getTime() - 30 * MS_DAY);
    const prev30Start = new Date(now.getTime() - 60 * MS_DAY);
    const last7Start = new Date(now.getTime() - 7 * MS_DAY);

    const alerts = this.buildAlerts(normalized, now, last7Start);
    const insights = this.buildInsights(
      normalized,
      now,
      last30Start,
      prev30Start,
      last7Start
    );

    return {
      alerts,
      insights,
      source: PROVIDER_NAME,
      generatedAt: now.toISOString(),
    };
  }

  buildAlerts(normalized, now, last7Start) {
    const alerts = [];
    const openTickets = normalized.filter((t) => t.isOpen);

    const stale7 = openTickets.filter((t) => daysBetween(t.created, now) >= 7);
    if (stale7.length > 0) {
      alerts.push(
        alert(
          stale7.length >= 5 ? "critical" : "warning",
          `${stale7.length} ticket aperti da oltre 7 giorni`,
          "Ticket ancora in lavorazione che superano la soglia operativa settimanale. Verificare priorità e assegnazione."
        )
      );
    }

    const highPriorityOpen = openTickets.filter((t) => t.priority === "alta");
    if (highPriorityOpen.length > 0) {
      alerts.push(
        alert(
          highPriorityOpen.length >= 3 ? "critical" : "warning",
          `${highPriorityOpen.length} ticket ad alta priorità ancora aperti`,
          "Ticket classificati come urgenti dall'AI richiedono intervento immediato del responsabile."
        )
      );
    }

    const stale5 = openTickets.filter((t) => {
      const age = daysBetween(t.created, now);
      return age >= 5 && age < 7;
    });
    if (stale5.length > 0) {
      alerts.push(
        alert(
          "warning",
          `${stale5.length} ticket in attesa da oltre 5 giorni`,
          'Ticket in stato "aperto" che stanno accumulando ritardo prima della soglia critica.'
        )
      );
    }

    const last30 = ticketsInRange(normalized, new Date(now.getTime() - 30 * MS_DAY), now);
    const prev30 = ticketsInRange(
      normalized,
      new Date(now.getTime() - 60 * MS_DAY),
      new Date(now.getTime() - 30 * MS_DAY)
    );
    const last30ByCat = countByCategory(last30);
    const prev30ByCat = countByCategory(prev30);

    Object.keys(last30ByCat).forEach((category) => {
      const current = last30ByCat[category] || 0;
      const previous = prev30ByCat[category] || 0;
      const change = percentChange(current, previous);
      if (current >= 2 && change >= 30) {
        alerts.push(
          alert(
            change >= 50 ? "critical" : "warning",
            `Categoria ${categoryLabel(category)} in aumento del ${change}%`,
            `Rispetto ai 30 giorni precedenti: ${previous} → ${current} ticket. Possibile problema ricorrente da investigare.`
          )
        );
      }
    });

    const recentByUser = {};
    ticketsInRange(normalized, last7Start, now).forEach((t) => {
      if (!t.userId) return;
      recentByUser[t.userId] = recentByUser[t.userId] || { count: 0, name: t.userName || "Dipendente" };
      recentByUser[t.userId].count += 1;
    });

    Object.values(recentByUser)
      .filter((entry) => entry.count >= 5)
      .sort((a, b) => b.count - a.count)
      .slice(0, 2)
      .forEach((entry) => {
        alerts.push(
          alert(
            entry.count >= 10 ? "critical" : "warning",
            `${entry.name}: ${entry.count} ticket questa settimana`,
            "Possibile sovraccarico operativo. Valutare redistribuzione o supporto dedicato."
          )
        );
      });

    if (alerts.length === 0) {
      alerts.push(
        alert(
          "info",
          "Nessuna criticità rilevata",
          "Al momento non ci sono alert operativi sui ticket analizzati."
        )
      );
    }

    return alerts;
  }

  buildInsights(normalized, now, last30Start, prev30Start, last7Start) {
    const insights = [];
    const last30 = ticketsInRange(normalized, last30Start, now);
    const prev30 = ticketsInRange(normalized, prev30Start, last30Start);

    const last30ByCat = countByCategory(last30);
    const prev30ByCat = countByCategory(prev30);

    const categoryTrends = Object.keys({ ...last30ByCat, ...prev30ByCat })
      .map((category) => ({
        category,
        current: last30ByCat[category] || 0,
        previous: prev30ByCat[category] || 0,
        change: percentChange(last30ByCat[category] || 0, prev30ByCat[category] || 0),
      }))
      .filter((row) => row.current >= 2)
      .sort((a, b) => b.change - a.change);

    if (categoryTrends.length > 0) {
      const top = categoryTrends[0];
      const direction = top.change >= 0 ? "aumentati" : "diminuiti";
      insights.push(
        insight(
          `Ticket ${categoryLabel(top.category)} ${direction} del ${Math.abs(top.change)}%`,
          `Negli ultimi 30 giorni: ${top.previous} → ${top.current} ticket nella categoria ${categoryLabel(top.category)}.`
        )
      );
    }

    const closedLast30 = last30.filter((t) => !t.isOpen);
    const closedPrev30 = prev30.filter((t) => !t.isOpen);
    const avgLast = avgResolutionDays(closedLast30);
    const avgPrev = avgResolutionDays(closedPrev30);

    if (avgLast != null && avgPrev != null && avgPrev > 0) {
      const improvement = percentChange(avgPrev, avgLast);
      if (improvement > 0) {
        insights.push(
          insight(
            `Tempo medio di risoluzione migliorato del ${improvement}%`,
            `Da ${avgPrev} a ${avgLast} giorni medi negli ultimi 30 giorni rispetto al mese precedente.`
          )
        );
      } else if (improvement < 0) {
        insights.push(
          insight(
            `Tempo medio di risoluzione peggiorato del ${Math.abs(improvement)}%`,
            `Da ${avgPrev} a ${avgLast} giorni medi. Considerare revisione dei processi di chiusura ticket.`
          )
        );
      }
    }

    const topLocation = detectLocation(last30.length ? last30 : normalized);
    if (topLocation) {
      insights.push(
        insight(
          `La maggior parte dei ticket proviene dalla sede di ${topLocation[0]}`,
          `${topLocation[1]} ticket rilevati con riferimenti alla sede negli ultimi periodi analizzati.`
        )
      );
    }

    const resolutionByCat = avgResolutionByCategory(normalized.filter((t) => !t.isOpen));
    const resolutionEntries = Object.entries(resolutionByCat).sort((a, b) => b[1] - a[1]);
    if (resolutionEntries.length >= 2) {
      const [slowestCat, slowestDays] = resolutionEntries[0];
      const [, fastestDays] = resolutionEntries[resolutionEntries.length - 1];
      if (slowestDays > fastestDays) {
        insights.push(
          insight(
            `I ticket ${categoryLabel(slowestCat)} richiedono più tempo`,
            `Tempo medio di risoluzione: ${slowestDays} giorni vs ${fastestDays} giorni nelle categorie più rapide.`
          )
        );
      }
    }

    const weekdayCounts = weekdayDistribution(
      last30.length >= 7 ? last30 : normalized
    );
    const mondayCount = weekdayCounts[1];
    const weekdayAvg =
      weekdayCounts.reduce((a, b, i) => (i === 0 || i === 6 ? a : a + b), 0) / 5;

    if (mondayCount > weekdayAvg * 1.2 && mondayCount >= 2) {
      insights.push(
        insight(
          "Picco di richieste il lunedì",
          `Il lunedì registra ${Math.round(mondayCount)} ticket in media vs ${Math.round(weekdayAvg)} negli altri giorni feriali.`
        )
      );
    }

    const openCount = normalized.filter((t) => t.isOpen).length;
    const closedCount = normalized.length - openCount;
    if (insights.length === 0 && normalized.length > 0) {
      insights.push(
        insight(
          "Panoramica ticket",
          `${openCount} aperti e ${closedCount} risolti nel dataset analizzato. Continua a monitorare le categorie principali.`
        )
      );
    }

    if (normalized.length === 0) {
      insights.push(
        insight(
          "Dati insufficienti",
          "Non ci sono ticket sufficienti per generare insight operativi."
        )
      );
    }

    return insights;
  }
}

const MS_DAY = 24 * 60 * 60 * 1000;
