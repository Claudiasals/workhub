/**
 * Rule-based fallbacks when no LLM API key is configured (demo / portfolio mode).
 */

const TICKET_RULES = [
  { re: /pc|computer|accesso|login|software|rete|server|bug|errore/i, category: "tecnico", priority: "alta" },
  { re: /magazzino|giacenza|stock|scaffale|inventario|carico|scarico/i, category: "magazzino", priority: "media" },
  { re: /ordine|consegna|corriere|spedizione|cliente/i, category: "ordine", priority: "media" },
  { re: /cliente|affiliazione|punti|tessera/i, category: "cliente", priority: "bassa" },
  { re: /turno|ferie|permesso|personale|dipendente|hr/i, category: "personale", priority: "media" },
];

export function classifyTicketHeuristic(title = "", description = "") {
  const text = `${title} ${description}`.toLowerCase();
  const match = TICKET_RULES.find((rule) => rule.re.test(text));

  const category = match?.category || "altro";
  const priority = match?.priority || (text.length > 120 ? "media" : "bassa");

  const summary =
    description.trim().slice(0, 160) ||
    `Segnalazione: ${title.trim() || "ticket senza titolo"}`;

  const adminSuggestions = {
    tecnico: "Verificare log di sistema e riprodurre il problema in ambiente di test.",
    magazzino: "Controllare giacenze e movimenti recenti del prodotto coinvolto.",
    ordine: "Verificare stato ordine, stock allocato e dati cliente associati.",
    cliente: "Consultare anagrafica cliente e storico ordini prima di rispondere.",
    personale: "Coordinarsi con il responsabile di reparto e verificare turni/ferie.",
    altro: "Assegnare a un referente e richiedere dettagli aggiuntivi se necessario.",
  };

  return {
    priority,
    category,
    summary,
    adminSuggestion: adminSuggestions[category],
  };
}

export function warehouseSuggestionsHeuristic(items = [], orders = []) {
  const suggestions = [];

  items.forEach((item) => {
    const stock = Number(item.stock ?? 0);
    const limit = Number(item.stockLimit ?? 0);
    const productName = item.product?.name || item.productName || "Prodotto";
    const location = item.pointOfSales?.name || item.locationName || "Sede";

    if (stock <= 0) {
      suggestions.push({
        type: "reorder",
        severity: "high",
        params: { productName, location },
        message: `${productName} esaurito presso ${location}. Riordino urgente consigliato.`,
      });
    } else if (stock <= limit) {
      suggestions.push({
        type: "low_stock",
        severity: "medium",
        params: { productName, location, stock, limit },
        message: `${productName} sotto soglia (${stock}/${limit}) a ${location}. Valutare riordino.`,
      });
    }
  });

  // Cross-location transfer hints
  const byProduct = new Map();
  items.forEach((item) => {
    const sku = item.product?.sku || item.sku || item.product?._id;
    if (!sku) return;
    if (!byProduct.has(sku)) byProduct.set(sku, []);
    byProduct.get(sku).push(item);
  });

  byProduct.forEach((rows, sku) => {
    const low = rows.filter((r) => Number(r.stock ?? 0) <= Number(r.stockLimit ?? 0));
    const high = rows.filter((r) => Number(r.stock ?? 0) > Number(r.stockLimit ?? 0) * 3);
    if (low.length && high.length) {
      const from = high[0];
      const to = low[0];
      suggestions.push({
        type: "transfer",
        severity: "medium",
        params: {
          productName: from.product?.name || sku,
          fromLocation: from.pointOfSales?.name || "sede A",
          toLocation: to.pointOfSales?.name || "sede B",
        },
        message: `Possibile trasferimento: ${from.product?.name || sku} da ${from.pointOfSales?.name || "sede A"} verso ${to.pointOfSales?.name || "sede B"}.`,
      });
    }
  });

  if (orders.length > 0) {
    const recentSkus = new Set();
    orders.slice(0, 20).forEach((order) => {
      order.items?.forEach?.((line) => recentSkus.add(line.sku || line.productName));
    });
    suggestions.push({
      type: "orders",
      severity: "info",
      params: { orderCount: orders.length, productCount: recentSkus.size || 0 },
      message: `${orders.length} ordini attivi nel periodo: verificare stock per ${recentSkus.size || "i"} prodotti più ordinati.`,
    });
  }

  if (suggestions.length === 0) {
    suggestions.push({
      type: "ok",
      severity: "info",
      params: {},
      message: "Nessuna anomalia rilevata. Stock e soglie risultano nella norma.",
    });
  }

  return { suggestions };
}

const WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

export function analyzeShiftsHeuristic(shifts = [], leaves = [], users = []) {
  const alerts = [];
  const coverage = {};

  WEEKDAYS.forEach((day) => {
    coverage[day] = { morning: 0, afternoon: 0 };
  });

  shifts.forEach((shiftDoc) => {
    Object.entries(shiftDoc.shifts || {}).forEach(([day, slots]) => {
      if (!coverage[day]) return;
      if (slots?.morning) coverage[day].morning += 1;
      if (slots?.afternoon) coverage[day].afternoon += 1;
    });
  });

  WEEKDAYS.forEach((day) => {
    ["morning", "afternoon"].forEach((period) => {
      if (coverage[day][period] === 0) {
        alerts.push({
          type: "gap",
          severity: "high",
          message: `Fascia scoperta: ${day} (${period === "morning" ? "mattina" : "pomeriggio"}) senza turni assegnati.`,
        });
      } else if (coverage[day][period] >= 4) {
        alerts.push({
          type: "overload",
          severity: "medium",
          message: `Possibile sovraccarico: ${day} ${period} con ${coverage[day][period]} dipendenti in turno.`,
        });
      }
    });
  });

  leaves.forEach((leaveDoc) => {
    (leaveDoc.requestedHours || [])
      .filter((r) => r.status === "approved" || r.status === "pending")
      .forEach((req) => {
        const user = users.find(
          (u) => String(u._id) === String(leaveDoc.user?._id || leaveDoc.user)
        );
        const name = user ? `${user.firstName} ${user.lastName}` : "Dipendente";
        alerts.push({
          type: "leave_overlap",
          severity: req.status === "approved" ? "medium" : "low",
          message: `${name}: ${req.mode === "vacation" ? "ferie" : "permesso"} ${req.status} (${req.hours}h) — verificare copertura turni.`,
        });
      });
  });

  const shiftCounts = shifts.map((s) => {
    let count = 0;
    Object.values(s.shifts || {}).forEach((slots) => {
      if (slots?.morning) count += 1;
      if (slots?.afternoon) count += 1;
    });
    return count;
  });

  if (shiftCounts.length >= 2) {
    const max = Math.max(...shiftCounts);
    const min = Math.min(...shiftCounts);
    if (max - min >= 3) {
      alerts.push({
        type: "imbalance",
        severity: "medium",
        message: `Distribuzione turni non equilibrata: scostamento fino a ${max - min} fasce tra dipendenti.`,
      });
    }
  }

  if (alerts.length === 0) {
    alerts.push({
      type: "ok",
      severity: "info",
      message: "Nessun alert critico sui turni della settimana corrente.",
    });
  }

  return { alerts, coverage };
}

export function generateCommunicationHeuristic(keywords = "") {
  const text = keywords.trim();
  const lower = text.toLowerCase();

  let title = "Comunicazione interna";
  if (/inventario/i.test(lower)) title = "Inventario programmato";
  if (/riunione|meeting/i.test(lower)) title = "Convocazione riunione";
  if (/formazione|corso/i.test(lower)) title = "Attività formativa";

  const body = `Si informa il personale che ${text}. Si richiede la massima puntualità e la collaborazione di tutti i dipendenti coinvolti. Eventuali ulteriori indicazioni saranno comunicate dal responsabile di sede.`;

  return {
    title,
    description: text,
    body,
  };
}

export function generateTicketReplyHeuristic({
  ticketTitle = "",
  ticketContent = "",
  keywords = "",
  lang = "it",
  userName = "",
}) {
  const kw = keywords.trim();
  const title = ticketTitle.trim() || (lang === "en" ? "your request" : "la sua segnalazione");
  const recipient =
    userName.trim() ||
    (lang === "en" ? "colleague" : "collega");

  const keywordSentence = kw
    ? lang === "en"
      ? `Regarding the next steps: ${kw.charAt(0).toUpperCase()}${kw.slice(1)}${/[.!?]$/.test(kw) ? "" : "."}`
      : `In merito agli aggiornamenti: ${kw.charAt(0).toUpperCase()}${kw.slice(1)}${/[.!?]$/.test(kw) ? "" : "."}`
    : lang === "en"
    ? "We have taken charge of the report and are working on the resolution."
    : "Abbiamo preso in carico la segnalazione e stiamo lavorando alla risoluzione.";

  const contextHint =
    ticketContent.trim().length > 0
      ? lang === "en"
        ? `We reviewed the details you provided about "${title}".`
        : `Abbiamo analizzato i dettagli da lei indicati relativi a "${title}".`
      : lang === "en"
      ? `We reviewed ticket "${title}".`
      : `Abbiamo analizzato il ticket "${title}".`;

  const body =
    lang === "en"
      ? `Dear ${recipient},\n\nThank you for contacting us.\n\n${contextHint}\n\n${keywordSentence}\n\nIf the issue persists or you need further support, please reply to this ticket.\n\nBest regards,\nWorkHub Support Team`
      : `Gentile ${recipient},\n\nLa ringraziamo per la segnalazione.\n\n${contextHint}\n\n${keywordSentence}\n\nQualora il problema dovesse persistere o necessitasse di ulteriori chiarimenti, la invitiamo a rispondere a questo ticket.\n\nCordiali saluti,\nTeam di supporto WorkHub`;

  return { body };
}

export function ticketSuggestionsHeuristic(tickets = []) {
  const suggestions = [];
  const now = Date.now();
  const openTickets = tickets.filter((t) => t.status === "open");

  openTickets.forEach((ticket) => {
    const name = ticket.name || ticket.title || "Ticket";
    const classification = ticket.aiClassification;
    const created = new Date(ticket.createdAt || ticket.updatedAt || now).getTime();
    const ageDays = Math.floor((now - created) / (1000 * 60 * 60 * 24));

    if (classification?.priority === "alta") {
      suggestions.push({
        type: "priority",
        severity: "high",
        message: `Priorità alta — "${name}": ${classification.adminSuggestion || classification.summary || "intervento urgente consigliato."}`,
      });
    } else if (!classification) {
      suggestions.push({
        type: "unclassified",
        severity: "medium",
        message: `"${name}" è aperto senza classificazione AI. Valutare priorità e categoria.`,
      });
    } else if (ageDays >= 7) {
      suggestions.push({
        type: "aging",
        severity: classification.priority === "media" ? "medium" : "low",
        message: `"${name}" aperto da ${ageDays} giorni (${classification.category}, ${classification.priority}).`,
      });
    } else if (classification.adminSuggestion) {
      suggestions.push({
        type: "action",
        severity: classification.priority === "alta" ? "high" : "medium",
        message: `"${name}": ${classification.adminSuggestion}`,
      });
    }
  });

  const openByCategory = openTickets.reduce((acc, ticket) => {
    const cat = ticket.aiClassification?.category || "altro";
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  Object.entries(openByCategory).forEach(([category, count]) => {
    if (count >= 2) {
      suggestions.push({
        type: "cluster",
        severity: "info",
        message: `${count} ticket aperti in categoria "${category}": verificare se c'è un problema ricorrente.`,
      });
    }
  });

  if (openTickets.length === 0) {
    suggestions.push({
      type: "ok",
      severity: "info",
      message: "Nessun ticket aperto nel periodo analizzato.",
    });
  } else if (suggestions.length === 0) {
    suggestions.push({
      type: "ok",
      severity: "info",
      message: `${openTickets.length} ticket aperti: nessun alert critico rilevato.`,
    });
  }

  return { suggestions };
}
