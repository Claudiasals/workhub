const MS_DAY = 24 * 60 * 60 * 1000;

const CATEGORY_LABELS = {
  tecnico: "Tecnico",
  magazzino: "Magazzino",
  ordine: "Ordini",
  cliente: "Cliente",
  personale: "Personale",
  altro: "Altro",
};

const LOCATION_KEYWORDS = [
  { key: "milano", label: "Milano" },
  { key: "roma", label: "Roma" },
  { key: "torino", label: "Torino" },
  { key: "napoli", label: "Napoli" },
];

export function categoryLabel(category) {
  return CATEGORY_LABELS[category] || "Altro";
}

export function daysBetween(from, to = new Date()) {
  return Math.floor((to.getTime() - from.getTime()) / MS_DAY);
}

export function normalizeTicket(ticket) {
  const created = new Date(ticket.createdAt || ticket.date || ticket.updatedAt);
  const updated = new Date(ticket.updatedAt || ticket.createdAt || ticket.date);
  const text = `${ticket.name || ""} ${ticket.content || ""}`.toLowerCase();

  return {
    raw: ticket,
    created,
    updated,
    isOpen: ticket.status === "open",
    category: ticket.aiClassification?.category || "altro",
    priority: ticket.aiClassification?.priority || null,
    userId: ticket.user?._id?.toString?.() || ticket.user?.id || ticket.user?.toString?.() || ticket.user,
    userName: [ticket.user?.firstName, ticket.user?.lastName].filter(Boolean).join(" ").trim(),
    userDept: ticket.user?.department || "",
    text,
  };
}

export function normalizeTickets(tickets = []) {
  return tickets.map(normalizeTicket).filter((t) => !Number.isNaN(t.created.getTime()));
}

export function ticketsInRange(normalized, start, end) {
  return normalized.filter((t) => t.created >= start && t.created <= end);
}

export function countByCategory(normalized) {
  return normalized.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + 1;
    return acc;
  }, {});
}

export function percentChange(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

export function avgResolutionDays(closedTickets) {
  if (!closedTickets.length) return null;
  const total = closedTickets.reduce(
    (sum, t) => sum + Math.max(0, daysBetween(t.created, t.updated)),
    0
  );
  return Math.round((total / closedTickets.length) * 10) / 10;
}

export function avgResolutionByCategory(normalized) {
  const closed = normalized.filter((t) => !t.isOpen);
  const buckets = {};

  closed.forEach((t) => {
    if (!buckets[t.category]) buckets[t.category] = [];
    buckets[t.category].push(Math.max(0, daysBetween(t.created, t.updated)));
  });

  return Object.entries(buckets).reduce((acc, [category, values]) => {
    acc[category] =
      Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
    return acc;
  }, {});
}

export function detectLocation(normalized) {
  const counts = {};

  normalized.forEach((t) => {
    for (const { key, label } of LOCATION_KEYWORDS) {
      if (t.text.includes(key) || t.userDept.toLowerCase().includes(key)) {
        counts[label] = (counts[label] || 0) + 1;
      }
    }
  });

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return sorted[0] || null;
}

export function weekdayDistribution(normalized) {
  const counts = [0, 0, 0, 0, 0, 0, 0];
  normalized.forEach((t) => {
    counts[t.created.getDay()] += 1;
  });
  return counts;
}

export { CATEGORY_LABELS, LOCATION_KEYWORDS };
