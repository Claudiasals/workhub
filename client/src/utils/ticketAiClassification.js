export const AI_PRIORITIES = ["alta", "media", "bassa"];

export const AI_CATEGORIES = [
  "tecnico",
  "magazzino",
  "ordine",
  "cliente",
  "personale",
  "altro",
];

export const TICKET_DEPARTMENT_LABEL_KEYS = {
  tecnico: "aiCatTecnico",
  magazzino: "aiCatMagazzino",
  ordine: "aiCatOrdine",
  cliente: "aiCatCliente",
  personale: "aiCatPersonale",
  altro: "aiCatAltro",
};

export function getTicketDepartmentLabelKey(department) {
  return TICKET_DEPARTMENT_LABEL_KEYS[department] || null;
}

/** Ticket classificato solo se l'AI ha assegnato una priorità valida. */
export function hasValidAiClassification(ticket) {
  const priority = ticket?.aiClassification?.priority;
  return AI_PRIORITIES.includes(priority);
}

/** Valore usato dai filtri: alta | media | bassa | none */
export function getTicketAiPriorityFilter(ticket) {
  if (!hasValidAiClassification(ticket)) return "none";
  return ticket.aiClassification.priority;
}

/** Classificazione da mostrare in UI, o null se non classificato. */
export function getDisplayAiClassification(ticket) {
  if (!hasValidAiClassification(ticket)) return null;
  return ticket.aiClassification;
}

export const AI_PRIORITY_ORDER = { alta: 0, media: 1, bassa: 2, none: 3 };

export function sortTicketsByAiPriority(a, b) {
  const pa = AI_PRIORITY_ORDER[getTicketAiPriorityFilter(a)] ?? 3;
  const pb = AI_PRIORITY_ORDER[getTicketAiPriorityFilter(b)] ?? 3;
  if (pa !== pb) return pa - pb;

  const da = new Date(a.date || a.createdAt || a.updatedAt);
  const db = new Date(b.date || b.createdAt || b.updatedAt);
  return db - da;
}
