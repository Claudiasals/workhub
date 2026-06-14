/** Client-side Business Overview fallback (mirrors server heuristics). */
export function analyzeBusinessOverviewLocal({
  items = [],
  orders = [],
  tickets = [],
  shifts = [],
}) {
  const alerts = [];
  const insights = [];
  const now = Date.now();
  const MS_DAY = 86400000;

  const lowByLoc = new Map();
  items.forEach((item) => {
    const stock = Number(item.stock?.["Mia Sede"] ?? item.stock ?? 0);
    const limit = Number(item.stockLimit ?? 0);
    if (stock > limit) return;
    const loc = item.pointOfSales?.name || item.pointOfSales || "Sede";
    lowByLoc.set(loc, (lowByLoc.get(loc) || 0) + 1);
  });

  lowByLoc.forEach((count, loc) => {
    alerts.push({
      type: count >= 4 ? "critical" : "warning",
      area: "magazzino",
      title: `Stock critico: ${count} prodotti sotto soglia`,
      description: `${count} articoli sotto soglia nella sede di ${loc}.`,
      actionLabel: "Vai al magazzino",
      targetRoute: "/warehouse",
    });
  });

  const openTickets = tickets.filter((t) => t.status === "open");
  const stale7 = openTickets.filter((t) => {
    const d = new Date(t.createdAt || t.updatedAt).getTime();
    return (now - d) / MS_DAY >= 7;
  });
  const urgentStale = stale7.filter((t) => t.aiClassification?.priority === "alta");

  if (urgentStale.length) {
    alerts.push({
      type: "critical",
      area: "ticket",
      title: `${urgentStale.length} ticket ad alta priorità aperti da oltre 7 giorni`,
      description: "Richiedono intervento immediato.",
      actionLabel: "Apri ticket",
      targetRoute: "/ticket",
    });
  } else if (stale7.length) {
    alerts.push({
      type: stale7.length >= 3 ? "critical" : "warning",
      area: "ticket",
      title: `${stale7.length} ticket aperti da oltre 7 giorni`,
      description: "Ticket in sospeso da risolvere.",
      actionLabel: "Apri ticket",
      targetRoute: "/ticket",
    });
  }

  const last30 = orders.filter((o) => now - new Date(o.createdAt).getTime() <= 30 * MS_DAY);
  const prev30 = orders.filter((o) => {
    const age = now - new Date(o.createdAt).getTime();
    return age > 30 * MS_DAY && age <= 60 * MS_DAY;
  });
  const rev = (list) =>
    list.reduce((s, o) => {
      const p = Number(o.product?.price) || 0;
      const q = Number(o.totalQuantity) || Number(o.quantity) || 1;
      return s + p * q;
    }, 0);
  const rLast = rev(last30);
  const rPrev = rev(prev30);
  if (rPrev > 0 && rLast < rPrev * 0.85) {
    const pct = Math.round(((rLast - rPrev) / rPrev) * 100);
    alerts.push({
      type: "warning",
      area: "vendite",
      title: `Vendite in calo del ${Math.abs(pct)}%`,
      description: "Ultimi 30 giorni vs periodo precedente.",
      actionLabel: "Vedi vendite",
      targetRoute: "/orders",
    });
  }

  if (shifts.length) {
    const coverage = { morning: 0, afternoon: 0 };
    shifts.forEach((doc) => {
      const day = new Date().getDay();
      const keys = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
      const dayKey = keys[day];
      const slots = doc.shifts?.[dayKey];
      if (slots?.morning) coverage.morning += 1;
      if (slots?.afternoon) coverage.afternoon += 1;
    });
    if (coverage.afternoon <= 1) {
      insights.push({
        type: "warning",
        area: "turni",
        title: "Copertura pomeridiana ridotta",
        description: "Pochi dipendenti assegnati nel pomeriggio odierno.",
        actionLabel: "Controlla turni",
        targetRoute: "/personale",
      });
    }
  }

  if (alerts.length === 0) {
    alerts.push({
      type: "info",
      area: "vendite",
      title: "Nessuna criticità immediata",
      description: "Operatività nella norma.",
    });
  }

  insights.push({
    type: "info",
    area: "vendite",
    title: "Panoramica",
    description: `${orders.length} ordini, ${openTickets.length} ticket aperti, ${items.length} articoli monitorati.`,
  });

  return {
    alerts: alerts.slice(0, 10),
    insights: insights.slice(0, 10),
    source: "heuristic",
    generatedAt: new Date().toISOString(),
  };
}
