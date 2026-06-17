/** Vendite fittizie mensili (indice 0 = gennaio, 11 = dicembre). */
export const DEMO_SALES_BY_MONTH = [
  { orders: 134, revenue: 51820, newClients: 24 },
  { orders: 121, revenue: 45890, newClients: 21 },
  { orders: 148, revenue: 57240, newClients: 29 },
  { orders: 161, revenue: 62150, newClients: 32 },
  { orders: 172, revenue: 66800, newClients: 34 },
  { orders: 178, revenue: 69420, newClients: 35 },
  { orders: 156, revenue: 58900, newClients: 27 },
  { orders: 102, revenue: 38450, newClients: 16 },
  { orders: 167, revenue: 64300, newClients: 31 },
  { orders: 185, revenue: 72100, newClients: 38 },
  { orders: 208, revenue: 81650, newClients: 42 },
  { orders: 231, revenue: 91280, newClients: 48 },
];

const EMPTY_MONTH = { orders: 0, revenue: 0, newClients: 0 };

export function getDemoSalesForMonthKey(monthKey) {
  const month = Number.parseInt(String(monthKey).split("-")[1], 10);
  if (!Number.isFinite(month) || month < 1 || month > 12) {
    return EMPTY_MONTH;
  }

  return DEMO_SALES_BY_MONTH[month - 1] || EMPTY_MONTH;
}
