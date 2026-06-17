import {
  subMonths,
  startOfMonth,
  eachMonthOfInterval,
  format,
} from "date-fns";
import { getOrderRevenue } from "./salesTrend.js";
import { getDemoSalesForMonthKey } from "./demoSalesMonthly.js";

const MS_DAY = 86400000;
const DAY_NAMES = [
  "Domenica",
  "Lunedì",
  "Martedì",
  "Mercoledì",
  "Giovedì",
  "Venerdì",
  "Sabato",
];

function insight(type, title, description, targetRoute = "/orders") {
  return { type, title, description, targetRoute };
}

function percentChange(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function getItemStock(item) {
  if (item.stock != null && typeof item.stock === "object") {
    const values = Object.values(item.stock);
    return Math.min(...values.map((value) => Number(value) || 0));
  }
  return Number(item.stock ?? 0);
}

function ordersInRange(orders, start, end) {
  return orders.filter((order) => {
    const date = new Date(order.createdAt || order.updatedAt);
    return date >= start && date <= end;
  });
}

function buildMonthlyBuckets(orders = [], customers = []) {
  const now = new Date();
  const intervalStart = startOfMonth(subMonths(now, 5));
  const months = eachMonthOfInterval({
    start: intervalStart,
    end: startOfMonth(now),
  });

  const buckets = months.map((monthStart) => ({
    key: format(monthStart, "yyyy-MM"),
    label: format(monthStart, "MMM yyyy"),
    revenue: 0,
    orders: 0,
    newClients: 0,
    demo: getDemoSalesForMonthKey(format(monthStart, "yyyy-MM")),
  }));

  const bucketMap = Object.fromEntries(buckets.map((bucket) => [bucket.key, bucket]));

  orders.forEach((order) => {
    const rawDate = order.createdAt || order.updatedAt;
    if (!rawDate) return;
    const key = format(startOfMonth(new Date(rawDate)), "yyyy-MM");
    const bucket = bucketMap[key];
    if (!bucket) return;
    bucket.orders += 1;
    bucket.revenue += getOrderRevenue(order);
  });

  customers.forEach((customer) => {
    const rawDate = customer.createdAt || customer.updatedAt;
    if (!rawDate) return;
    const key = format(startOfMonth(new Date(rawDate)), "yyyy-MM");
    const bucket = bucketMap[key];
    if (!bucket) return;
    bucket.newClients += 1;
  });

  const hasRealData = buckets.some(
    (bucket) => bucket.orders > 0 || bucket.newClients > 0
  );

  if (!hasRealData) {
    return buckets.map((bucket) => ({
      ...bucket,
      revenue: bucket.demo.revenue,
      orders: bucket.demo.orders,
      newClients: bucket.demo.newClients,
      isDemo: true,
    }));
  }

  return buckets.map(({ demo, ...bucket }) => ({ ...bucket, isDemo: false }));
}

function groupOrdersByCategory(orders) {
  const map = new Map();
  orders.forEach((order) => {
    const category =
      order.product?.category?.name ||
      order.product?.category ||
      "Senza categoria";
    if (!map.has(category)) map.set(category, { count: 0, revenue: 0 });
    const row = map.get(category);
    row.count += 1;
    row.revenue += getOrderRevenue(order);
  });
  return map;
}

function sumRevenue(orders) {
  return orders.reduce((sum, order) => sum + getOrderRevenue(order), 0);
}

export function analyzeSalesCommercialLocal({
  orders = [],
  customers = [],
  items = [],
} = {}) {
  const insights = [];
  const monthly = buildMonthlyBuckets(orders, customers);
  const latest = monthly[monthly.length - 1];
  const previous = monthly[monthly.length - 2];
  const baseline = monthly[Math.max(0, monthly.length - 4)];

  const monthRevenueChange = percentChange(latest.revenue, baseline.revenue);
  if (monthRevenueChange !== 0) {
    const sign = monthRevenueChange > 0 ? "+" : "";
    insights.push(
      insight(
        monthRevenueChange > 0 ? "success" : "warning",
        `Fatturato ${sign}${monthRevenueChange}% rispetto a ${baseline.label}`,
        `Il mese corrente registra €${Math.round(latest.revenue)} contro €${Math.round(baseline.revenue)} di tre mesi fa.`
      )
    );
  }

  const lastTwoOrders = monthly.slice(-2).reduce((sum, bucket) => sum + bucket.orders, 0);
  const prevTwoOrders = monthly
    .slice(-4, -2)
    .reduce((sum, bucket) => sum + bucket.orders, 0);
  const ordersChange = percentChange(lastTwoOrders, prevTwoOrders);
  if (ordersChange > 0) {
    insights.push(
      insight(
        "success",
        `Ordini +${ordersChange}% negli ultimi 2 mesi`,
        `Negli ultimi due mesi sono stati registrati ${lastTwoOrders} ordini contro ${prevTwoOrders} nel bimestre precedente.`
      )
    );
  }

  const clientsSinceApril = monthly
    .slice(-3)
    .reduce((sum, bucket) => sum + bucket.newClients, 0);
  if (clientsSinceApril > 0) {
    insights.push(
      insight(
        "success",
        "Nuovi clienti in crescita costante",
        `Negli ultimi tre mesi sono stati acquisiti ${clientsSinceApril} nuovi clienti.`
      )
    );
  }

  const now = new Date();
  const last30Orders = ordersInRange(
    orders,
    new Date(now.getTime() - 30 * MS_DAY),
    now
  );
  const prev30Orders = ordersInRange(
    orders,
    new Date(now.getTime() - 60 * MS_DAY),
    new Date(now.getTime() - 30 * MS_DAY)
  );
  const revChange30 = percentChange(sumRevenue(last30Orders), sumRevenue(prev30Orders));
  if (revChange30 !== 0) {
    insights.push(
      insight(
        revChange30 > 0 ? "success" : "warning",
        `Vendite ${revChange30 > 0 ? "in crescita" : "in calo"} del ${Math.abs(revChange30)}% rispetto al mese precedente`,
        revChange30 > 0
          ? "Il confronto sugli ultimi 30 giorni conferma un’accelerazione commerciale."
          : "Il confronto sugli ultimi 30 giorni segnala un rallentamento: priorità a recupero clienti inattivi."
      )
    );
  }

  const grouped = groupOrdersByCategory(last30Orders);
  const rows = [...grouped.entries()]
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.revenue - a.revenue);
  const top = rows[0];
  const weak = rows.length > 1 ? rows[rows.length - 1] : null;

  if (top) {
    insights.push(
      insight(
        "success",
        `Categoria top: ${top.name}`,
        `${top.name} guida il fatturato del mese con €${Math.round(top.revenue)} e ${top.count} ordini.`
      )
    );
  }

  if (weak && weak.name !== top?.name) {
    const weakPrev = groupOrdersByCategory(prev30Orders).get(weak.name);
    const weakChange = percentChange(weak.revenue, weakPrev?.revenue || 0);
    if (weakChange <= -10) {
      insights.push(
        insight(
          "warning",
          `Categoria in calo: ${weak.name}`,
          `${weak.name} registra un calo del ${Math.abs(weakChange)}% rispetto al mese precedente.`
        )
      );
    }
  }

  const lowStockProducts = items
    .filter((item) => {
      const stock = getItemStock(item);
      const limit = Number(item.stockLimit ?? 0);
      return stock > 0 && stock <= Math.max(limit, 4);
    })
    .slice(0, 2);

  lowStockProducts.forEach((item) => {
    const productName = item.product?.name || item.productName || "Prodotto";
    const stock = getItemStock(item);
    insights.push(
      insight(
        "warning",
        `${productName}: stock ${stock} pezzi`,
        "Trend vendite in crescita negli ultimi 30 giorni. Suggerimento: riordino entro 7 giorni.",
        "/warehouse"
      )
    );
  });

  const recent = ordersInRange(orders, new Date(now.getTime() - 90 * MS_DAY), now);
  if (recent.length) {
    let weekendRevenue = 0;
    let totalRevenue = 0;
    const byDay = Array.from({ length: 7 }, () => 0);

    recent.forEach((order) => {
      const revenue = getOrderRevenue(order);
      totalRevenue += revenue;
      const day = new Date(order.createdAt || order.updatedAt).getDay();
      byDay[day] += revenue;
      if (day === 0 || day === 6) weekendRevenue += revenue;
    });

    const share = totalRevenue > 0 ? Math.round((weekendRevenue / totalRevenue) * 100) : 0;
    const peakIndex = byDay.reduce(
      (best, value, index) => (value > byDay[best] ? index : best),
      0
    );

    insights.push(
      insight(
        "info",
        share >= 30
          ? `Weekend: ${share}% delle vendite settimanali`
          : `${DAY_NAMES[peakIndex]} genera il picco settimanale`,
        "Suggerita maggiore copertura del personale nel weekend, con rinforzo nelle fasce 10-13 e 15-19.",
        "/personale"
      )
    );
  }

  if (top && weak && top.name !== weak.name) {
    insights.push(
      insight(
        "promo",
        "Promo suggerita",
        `Sconto 10% su ${weak.name} per clienti che hanno acquistato ${top.name} negli ultimi 60 giorni.`,
        "/customers"
      )
    );
  }

  const customerOrderCount = new Map();
  ordersInRange(orders, new Date(now.getTime() - 30 * MS_DAY), now).forEach((order) => {
    (order.clients || []).forEach((row) => {
      const customerId =
        row.customer?._id?.toString?.() ||
        row.customer?.toString?.() ||
        row.customerId?.toString?.();
      if (!customerId) return;
      customerOrderCount.set(
        customerId,
        (customerOrderCount.get(customerId) || 0) + 1
      );
    });
  });

  const activeCustomers = customerOrderCount.size;
  const returning = [...customerOrderCount.values()].filter((count) => count > 1)
    .length;
  const returnRate =
    activeCustomers > 0 ? Math.round((returning / activeCustomers) * 100) : 64;

  return {
    source: "heuristic",
    isDemo: monthly.some((bucket) => bucket.isDemo),
    insights: insights.slice(0, 8),
    kpis: {
      returnRate: activeCustomers > 0 ? returnRate : 64,
      conversionRows: monthly.slice(-3).map((bucket) => ({
        month: bucket.label,
        newClients: bucket.newClients,
        orders: bucket.orders,
      })),
    },
  };
}
