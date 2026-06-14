const MS_DAY = 24 * 60 * 60 * 1000;

export function getOrderRevenue(order) {
  const unitPrice = Number(order.product?.price) || 0;
  if (order.quantity != null) {
    return Number(order.quantity) * unitPrice;
  }
  const clients = order.clients || [];
  const qty = clients.reduce((s, c) => s + (Number(c.quantity) || 0), 0);
  return (qty || Number(order.totalQuantity) || 0) * unitPrice;
}

export function ordersInRange(orders, start, end) {
  return orders.filter((o) => {
    const d = new Date(o.createdAt || o.updatedAt);
    return d >= start && d <= end;
  });
}

export function sumRevenue(orders) {
  return orders.reduce((s, o) => s + getOrderRevenue(o), 0);
}

export function percentChange(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

export function productLocationKey(order) {
  const productId =
    order.product?._id?.toString?.() || order.product?.toString?.() || order.product;
  const productName = order.product?.name || "Prodotto";
  const posName =
    order.pointOfSales?.name ||
    order.pointOfSales?.city ||
    order.pointOfSales?.toString?.() ||
    "Sede";
  return { productId, productName, posName, key: `${productId}::${posName}` };
}

export function groupOrdersByProductLocation(orders) {
  const map = new Map();
  orders.forEach((order) => {
    const { key, productName, posName } = productLocationKey(order);
    if (!map.has(key)) {
      map.set(key, { productName, posName, count: 0, revenue: 0 });
    }
    const row = map.get(key);
    row.count += 1;
    row.revenue += getOrderRevenue(order);
  });
  return map;
}

export function daysSince(date) {
  return Math.floor((Date.now() - new Date(date).getTime()) / MS_DAY);
}
