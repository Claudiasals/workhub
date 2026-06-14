import { callLlmJson, isAiConfigured, withSource } from "./llmClient.js";
import {
  analyzeShiftsHeuristic,
  classifyTicketHeuristic,
  generateCommunicationHeuristic,
  generateTicketReplyHeuristic,
  ticketSuggestionsHeuristic,
  warehouseSuggestionsHeuristic,
} from "./heuristics.js";

export async function classifyTicket({ title = "", description = "" }) {
  const systemPrompt = `Sei un assistente operativo per WorkHub. Classifica ticket interni aziendali.
Rispondi SOLO con JSON valido:
{
  "priority": "bassa|media|alta",
  "category": "tecnico|magazzino|ordine|cliente|personale|altro",
  "summary": "stringa breve",
  "adminSuggestion": "azione operativa per l'admin"
}`;

  const userPrompt = `Titolo: ${title}\nDescrizione: ${description}`;

  const llmResult = await callLlmJson({ systemPrompt, userPrompt });
  if (llmResult?.priority && llmResult?.category) {
    return withSource(
      {
        priority: llmResult.priority,
        category: llmResult.category,
        summary: llmResult.summary || description.slice(0, 160),
        adminSuggestion: llmResult.adminSuggestion || "",
      },
      "ai"
    );
  }

  return withSource(classifyTicketHeuristic(title, description), "heuristic");
}

export async function getWarehouseSuggestions({ items = [], orders = [], lang = "it" }) {
  const compactItems = items.map((item) => ({
    sku: item.product?.sku,
    name: item.product?.name,
    stock: item.stock,
    stockLimit: item.stockLimit,
    location: item.pointOfSales?.name,
  }));

  const compactOrders = orders.map((order) => ({
    status: order.status,
    totalQty: order.totalQuantity,
    productName: order.product?.name || order.productName,
    location: order.pointOfSales?.name,
  }));

  const language = lang === "en" ? "English" : "Italian";
  const systemPrompt = `Sei un assistente magazzino WorkHub. Analizza stock, soglie, sedi e ordini.
Rispondi SOLO con JSON:
{
  "suggestions": [
    { "type": "low_stock|reorder|transfer|anomaly|orders|ok", "severity": "high|medium|low|info", "message": "testo pratico in ${language}" }
  ]
}`;

  const userPrompt = JSON.stringify({ items: compactItems, orders: compactOrders });

  const llmResult = await callLlmJson({ systemPrompt, userPrompt });
  if (Array.isArray(llmResult?.suggestions) && llmResult.suggestions.length) {
    return withSource({ suggestions: llmResult.suggestions }, "ai");
  }

  return withSource(warehouseSuggestionsHeuristic(items, orders), "heuristic");
}

export async function analyzeShifts({ shifts = [], leaves = [], users = [] }) {
  const payload = {
    shifts: shifts.map((s) => ({ userId: s.user, shifts: s.shifts })),
    leaves: leaves.map((l) => ({
      userId: l.user,
      requests: l.requestedHours?.filter((r) => r.status !== "denied"),
    })),
    users: users.map((u) => ({
      id: u._id,
      name: `${u.firstName} ${u.lastName}`,
      department: u.department,
    })),
  };

  const systemPrompt = `Sei un assistente turni WorkHub. Individua fasce scoperte, sovraccarichi, conflitti ferie/permessi, squilibri.
NON modificare turni. Solo alert e proposte.
Rispondi SOLO con JSON:
{
  "alerts": [
    { "type": "gap|overload|leave_overlap|imbalance|ok", "severity": "high|medium|low|info", "message": "testo in italiano" }
  ],
  "coverage": {}
}`;

  const llmResult = await callLlmJson({
    systemPrompt,
    userPrompt: JSON.stringify(payload),
  });

  if (Array.isArray(llmResult?.alerts) && llmResult.alerts.length) {
    return withSource(
      {
        alerts: llmResult.alerts,
        coverage: llmResult.coverage || {},
      },
      "ai"
    );
  }

  return withSource(analyzeShiftsHeuristic(shifts, leaves, users), "heuristic");
}

export async function generateCommunication({ keywords = "", lang = "it" }) {
  const systemPrompt = `Trasforma parole chiave in comunicazione interna professionale per dipendenti WorkHub.
Lingua: ${lang === "en" ? "inglese" : "italiano"}.
Rispondi SOLO con JSON:
{
  "title": "titolo breve",
  "description": "sintesi una riga",
  "body": "testo completo professionale pronto da inviare"
}`;

  const llmResult = await callLlmJson({
    systemPrompt,
    userPrompt: keywords,
  });

  if (llmResult?.title && llmResult?.body) {
    return withSource(
      {
        title: llmResult.title,
        description: llmResult.description || keywords,
        body: llmResult.body,
      },
      "ai"
    );
  }

  return withSource(generateCommunicationHeuristic(keywords), "heuristic");
}

export async function generateTicketReply({
  ticketTitle = "",
  ticketContent = "",
  keywords = "",
  lang = "it",
  userName = "",
}) {
  const language = lang === "en" ? "English" : "Italian";

  const systemPrompt = `Sei un assistente WorkHub che aiuta un admin a rispondere professionalmente a un ticket interno.
Lingua della risposta: ${language}.
Rispondi SOLO con JSON valido:
{
  "body": "messaggio completo professionale, pronto da inviare al dipendente che ha aperto il ticket"
}
Regole:
- tono cordiale ma professionale
- integra le parole chiave dell'admin in modo naturale
- fai riferimento al ticket e al contesto
- non inventare dati tecnici non presenti nelle parole chiave
- firma con "Team di supporto WorkHub" (it) o "WorkHub Support Team" (en)`;

  const userPrompt = JSON.stringify({
    ticketTitle,
    ticketContent: ticketContent.slice(0, 800),
    adminKeywords: keywords,
    recipientName: userName,
  });

  const llmResult = await callLlmJson({ systemPrompt, userPrompt });
  if (llmResult?.body) {
    return withSource({ body: llmResult.body }, "ai");
  }

  return withSource(
    generateTicketReplyHeuristic({
      ticketTitle,
      ticketContent,
      keywords,
      lang,
      userName,
    }),
    "heuristic"
  );
}

export async function getTicketSuggestions({ tickets = [] }) {
  const compact = tickets.map((ticket) => ({
    name: ticket.name,
    status: ticket.status,
    content: (ticket.content || "").slice(0, 300),
    createdAt: ticket.createdAt,
    aiClassification: ticket.aiClassification,
  }));

  const systemPrompt = `Sei un assistente ticket WorkHub per admin. Analizza ticket aperti e classificazioni AI.
Rispondi SOLO con JSON:
{
  "suggestions": [
    { "type": "priority|aging|cluster|action|unclassified|ok", "severity": "high|medium|low|info", "message": "testo pratico in italiano con nome ticket" }
  ]
}`;

  const llmResult = await callLlmJson({
    systemPrompt,
    userPrompt: JSON.stringify({ tickets: compact }),
  });

  if (Array.isArray(llmResult?.suggestions) && llmResult.suggestions.length) {
    return withSource({ suggestions: llmResult.suggestions }, "ai");
  }

  return withSource(ticketSuggestionsHeuristic(tickets), "heuristic");
}

export { isAiConfigured };
