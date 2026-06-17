/**
 * Client-side heuristic mirror for demo / offline ticket insights.
 * Production uses POST /ai/tickets/insights (TicketInsightsService).
 */

const MS_DAY = 24 * 60 * 60 * 1000;

const CATEGORY_LABELS = {
  tecnico: "Tecnico",
  magazzino: "Magazzino",
  ordine: "Ordini",
  cliente: "Cliente",
  personale: "Personale",
  altro: "Altro",
};

function categoryLabel(category) {
  return CATEGORY_LABELS[category] || "Altro";
}

function daysBetween(from, to = new Date()) {
  return Math.floor((to.getTime() - from.getTime()) / MS_DAY);
}

function normalizeTicket(ticket) {
  const created = new Date(ticket.createdAt || ticket.date || ticket.updatedAt);
  const updated = new Date(ticket.updatedAt || ticket.createdAt || ticket.date);
  const text = `${ticket.name || ""} ${ticket.content || ""}`.toLowerCase();

  return {
    created,
    updated,
    isOpen: ticket.status === "open",
    category: ticket.aiClassification?.category || "altro",
    priority: ticket.aiClassification?.priority || null,
    userId: ticket.user?._id || ticket.user?.id || ticket.user,
    userName: [ticket.user?.firstName, ticket.user?.lastName].filter(Boolean).join(" ").trim(),
    userDept: ticket.user?.department || "",
    text,
  };
}

function ticketsInRange(normalized, start, end) {
  return normalized.filter((t) => t.created >= start && t.created <= end);
}

function countByCategory(normalized) {
  return normalized.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + 1;
    return acc;
  }, {});
}

function percentChange(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function avgResolutionDays(closedTickets) {
  if (!closedTickets.length) return null;
  const total = closedTickets.reduce(
    (sum, t) => sum + Math.max(0, daysBetween(t.created, t.updated)),
    0
  );
  return Math.round((total / closedTickets.length) * 10) / 10;
}

function detectLocation(normalized) {
  const keywords = [
    { key: "milano", label: "Milano" },
    { key: "roma", label: "Roma" },
    { key: "torino", label: "Torino" },
  ];
  const counts = {};
  normalized.forEach((t) => {
    keywords.forEach(({ key, label }) => {
      if (t.text.includes(key) || t.userDept.toLowerCase().includes(key)) {
        counts[label] = (counts[label] || 0) + 1;
      }
    });
  });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return sorted[0] || null;
}

export function analyzeTicketInsightsLocal(tickets = []) {
  const normalized = tickets.map(normalizeTicket).filter((t) => !Number.isNaN(t.created.getTime()));
  const now = new Date();
  const last7Start = new Date(now.getTime() - 7 * MS_DAY);
  const last30Start = new Date(now.getTime() - 30 * MS_DAY);
  const prev30Start = new Date(now.getTime() - 60 * MS_DAY);

  const alerts = [];
  const insights = [];
  const openTickets = normalized.filter((t) => t.isOpen);

  const stale7 = openTickets.filter((t) => daysBetween(t.created, now) >= 7);
  if (stale7.length > 0) {
    alerts.push({
      type: stale7.length >= 5 ? "critical" : "warning",
      title: `${stale7.length} ticket aperti da oltre 7 giorni`,
      description:
        "Ticket ancora in lavorazione che superano la soglia operativa settimanale.",
    });
  }

  const highPriorityOpen = openTickets.filter((t) => t.priority === "alta");
  if (highPriorityOpen.length > 0) {
    alerts.push({
      type: highPriorityOpen.length >= 3 ? "critical" : "warning",
      title: `${highPriorityOpen.length} ticket ad alta priorità ancora aperti`,
      description: "Ticket urgenti classificati dall'AI che richiedono intervento immediato.",
    });
  }

  const last30 = ticketsInRange(normalized, last30Start, now);
  const prev30 = ticketsInRange(normalized, prev30Start, last30Start);
  const last30ByCat = countByCategory(last30);
  const prev30ByCat = countByCategory(prev30);

  Object.keys(last30ByCat).forEach((category) => {
    const current = last30ByCat[category] || 0;
    const previous = prev30ByCat[category] || 0;
    const change = percentChange(current, previous);
    if (current >= 2 && change >= 30) {
      alerts.push({
        type: change >= 50 ? "critical" : "warning",
        title: `Categoria ${categoryLabel(category)} in aumento del ${change}%`,
        description: `Rispetto ai 30 giorni precedenti: ${previous} → ${current} ticket.`,
      });
    }
  });

  const recentByUser = {};
  ticketsInRange(normalized, last7Start, now).forEach((t) => {
    if (!t.userId) return;
    recentByUser[t.userId] = recentByUser[t.userId] || { count: 0, name: t.userName || "Dipendente" };
    recentByUser[t.userId].count += 1;
  });
  Object.values(recentByUser)
    .filter((e) => e.count >= 5)
    .forEach((entry) => {
      alerts.push({
        type: entry.count >= 10 ? "critical" : "warning",
        title: `${entry.name}: ${entry.count} ticket questa settimana`,
        description: "Possibile sovraccarico operativo.",
      });
    });

  if (alerts.length === 0) {
    alerts.push({
      type: "info",
      title: "Nessuna criticità rilevata",
      description: "Non ci sono alert operativi sui ticket analizzati.",
    });
  }

  const trends = Object.keys({ ...last30ByCat, ...prev30ByCat })
    .map((category) => ({
      category,
      current: last30ByCat[category] || 0,
      previous: prev30ByCat[category] || 0,
      change: percentChange(last30ByCat[category] || 0, prev30ByCat[category] || 0),
    }))
    .filter((r) => r.current >= 1)
    .sort((a, b) => b.change - a.change);

  if (trends[0]) {
    const top = trends[0];
    insights.push({
      type: "info",
      title: `Ticket ${categoryLabel(top.category)} ${top.change >= 0 ? "aumentati" : "diminuiti"} del ${Math.abs(top.change)}%`,
      description: `Negli ultimi 30 giorni: ${top.previous} → ${top.current} ticket.`,
    });
  }

  const avgLast = avgResolutionDays(last30.filter((t) => !t.isOpen));
  const avgPrev = avgResolutionDays(prev30.filter((t) => !t.isOpen));
  if (avgLast != null && avgPrev != null && avgPrev > 0) {
    const improvement = percentChange(avgPrev, avgLast);
    insights.push({
      type: "info",
      title:
        improvement >= 0
          ? `Tempo medio di risoluzione migliorato del ${improvement}%`
          : `Tempo medio di risoluzione peggiorato del ${Math.abs(improvement)}%`,
      description: `Da ${avgPrev} a ${avgLast} giorni medi tra i periodi analizzati.`,
    });
  }

  const topLocation = detectLocation(last30.length ? last30 : normalized);
  if (topLocation) {
    insights.push({
      type: "info",
      title: `La maggior parte dei ticket proviene dalla sede di ${topLocation[0]}`,
      description: `${topLocation[1]} ticket con riferimenti alla sede.`,
    });
  }

  if (insights.length === 0 && normalized.length > 0) {
    insights.push({
      type: "info",
      title: "Trend ticket",
      description: `${openTickets.length} aperti su ${normalized.length} ticket nel periodo analizzato.`,
    });
  }

  if (normalized.length === 0) {
    insights.push({
      type: "info",
      title: "Dati insufficienti",
      description: "Non ci sono ticket sufficienti per generare insight.",
    });
  }

  return {
    alerts,
    insights,
    source: "heuristic",
    generatedAt: new Date().toISOString(),
  };
}
