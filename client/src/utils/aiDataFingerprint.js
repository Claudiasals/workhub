/** Snapshot leggero dei dati: se cambia, ha senso rivalutare l'enrichment API. */
import { getTicketAiPriorityFilter } from "./ticketAiClassification";

export function salesCommercialFingerprint({ orders = [], customers = [], items = [] }) {
  const criticalStock = items.filter(
    (item) =>
      Number(item.stock?.["Mia Sede"] ?? item.stock ?? 0) <=
      Number(item.stockLimit ?? 0)
  ).length;

  return [
    orders.length,
    customers.length,
    items.length,
    criticalStock,
  ].join("|");
}

export function businessOverviewFingerprint({
  orders = [],
  tickets = [],
  items = [],
  shifts = [],
}) {
  const openTickets = tickets.filter((ticket) => ticket.status === "open").length;
  const criticalStock = items.filter(
    (item) =>
      Number(item.stock?.["Mia Sede"] ?? item.stock ?? 0) <=
      Number(item.stockLimit ?? 0)
  ).length;

  return [orders.length, openTickets, criticalStock, shifts.length].join("|");
}

export function warehouseAiFingerprint({ items = [], orders = [] }) {
  const lowStock = items.filter(
    (item) =>
      Number(item.stock?.["Mia Sede"] ?? item.stock ?? 0) <=
      Number(item.stockLimit ?? 0)
  ).length;

  return [items.length, orders.length, lowStock].join("|");
}

export function ticketInsightsFingerprint(tickets = []) {
  const open = tickets.filter((ticket) => ticket.status === "open").length;
  const alta = tickets.filter(
    (ticket) => getTicketAiPriorityFilter(ticket) === "alta"
  ).length;

  return [tickets.length, open, alta].join("|");
}
